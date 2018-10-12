import React, {Component} from 'react'
import { Segment, Comment } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { setUserPosts } from '../../actions'
import MessagesHeader from './MessagesHeader'
import MessageForm from './MessagesForm'
import firebase from '../../firebase'
import Message from './Message'

class Messages extends Component{
    constructor(props){
        super(props)

        this.state = {
            messagesRef: firebase.database().ref('messages'),
            channel: this.props.currentChannel,
            user: this.props.currentUser,
            messages: [],
            messagesLoading: true,
            numUniqueUsers: "",
            searchTerm: "",
            searchLoading: false,
            searchResults: [],
            privateChannel: this.props.isPrivateChannel,
            privateMessagesRef: firebase.database().ref('privateMessages'),
            isChannelStarred: false,
            usersRef: firebase.database().ref('users'),
            listeners: []
        }
    }

    componentDidMount(){
        const { channel, user, listeners } = this.state

        if(channel && user){
            this.removeListeners(listeners)
            this.addListeners(channel.id)
            this.addUserStarsListener(channel.id, user.uid)
        }
    }

    componentWillUnmount(){
        this.removeListeners(this.state.listeners)
        // this.state.connectedRef.off()
    }

    addToListeners = (id, ref, event) => {
        const index = this.state.listeners.findIndex(listener => {
            return listener.id === id && listener.ref === ref && listener.event
        })

        if(index === -1){
            const newListener = {id, ref, event}
            this.setState({listeners: this.state.listeners.concat(newListener)})
        }
    }

    removeListeners = (listeners) => {
        listeners.forEach(listener => {
            listener.ref.child(listener.id).off(listener.event)
        })
    }

    componentDidUpdate(prevProps, prevState){
        if(this.messagesEnd){
            this.scrollToBottom()
        }
    }

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: 'smooth'})
    }

    addListeners(channelId){
        this.addMessageListener(channelId)
    }

    addMessageListener = (channelId) => {
        let loadedMessages = []
        const ref = this.getMessagesRef()
        ref.child(channelId).on('child_added', snap => {
            loadedMessages.push(snap.val())
            this.setState({messages: loadedMessages, messagesLoading: false})
        })

        this.countUniqueUsers(loadedMessages)
        this.countUserPosts(loadedMessages);

        this.addToListeners(channelId, ref, 'child_added');
    }

    addUserStarsListener = (channelId, userId) => {
        this.state.usersRef
            .child(userId)
            .child('starred')
            .once('value')
            .then(data => {
                if(data.val() !== null){
                    const channelIds = Object.keys(data.val())
                    const prevStarred = channelIds.includes(channelId)
                    this.setState({isChannelStarred: prevStarred})
                }
            })
    }

    getMessagesRef = () => {
        const { messagesRef, privateMessagesRef, privateChannel } = this.state
        return privateChannel ? privateMessagesRef : messagesRef

    }

    handleStar = () => {
        this.setState(prevState => ({
            isChannelStarred: !prevState.isChannelStarred
        }), () => this.starChannel())
    }

    starChannel = () => {
        if(this.state.isChannelStarred){
            this.state.usersRef
                .child(`${this.state.user.uid}/starred`)
                .update({
                    [this.state.channel.id]: {
                        name: this.state.channel.name,
                        details: this.state.channel.details,
                        createdBy: {
                            name: this.state.channel.createdBy.name,
                            avatar: this.state.channel.createdBy.avatar
                        }

                    }
                })
        }else{
            this.state.usersRef
                .child(`${this.state.user.uid}/starred`)
                .child(this.state.channel.id)
                .remove(err => {
                    if(err !== null){
                        console.error(err)
                    }
                })
        }
    }

    handleSearchChange = e => {
        this.setState({searchTerm: e.target.value, searchLoading: true}, () => this.handleSearchMessages())
    }

    handleSearchMessages(){
        const channelMessages = [...this.state.messages]
        const regex = new RegExp(this.state.searchTerm, 'gi')
        const searchResults = channelMessages.reduce((acc, message) => {
            if(message.content && message.content.match(regex)){
                acc.push(message)
            }
            return acc
        },[])

        this.setState({searchResults})
        setTimeout(() => this.setState({searchLoading: false}), 1000 )
    }


    countUniqueUsers = (messages) => {
        const uniqueUsers = messages.reduce((acc, message) => {
            if(!acc.includes(message.user.name)){
                acc.push(message.user.name)
            }
            return acc
        },[])

        const plural = uniqueUsers.length > 1
        const numUniqueUsers = `${uniqueUsers.length} user${plural ? "s" :""}`;

        this.setState({ numUniqueUsers })
    }

    countUserPosts = messages => {
        let userPosts = messages.reduce((acc, message) => {
            if(message.user.name in acc){
                acc[message.user.name].count += 1
            }else{
                acc[message.user.name] = {
                    avatar: message.user.avatar,
                    count: 1
                }
            }

            return acc
        },{})
        this.props.setUserPosts(userPosts)
    }

    displayMessages = (messages) => (

        messages.length > 0 && messages.map(message => (
            <Message  
                key={message.timestamp}
                message={message}
                user={this.state.user}
            />
        ))
    )

    displayChannelName = channel => {
        return channel ? `${this.state.privateChannel ? '@' : `#`}${channel.name}` : ""
    }

    render(){
    
        const { messagesRef, messages, channel, user, numUniqueUsers, searchTerm, searchResults, searchLoading, privateChannel, isChannelStarred } = this.state

        return(
            <React.Fragment>
                <MessagesHeader
                    channelName={this.displayChannelName(channel)}
                    numUniqueUsers={numUniqueUsers}
                    handleSearchChange={this.handleSearchChange}
                    searchLoading={searchLoading}
                    privateChannel={privateChannel}
                    getMessagesRef={this.getMessagesRef}
                    handleStar={this.handleStar}
                    isChannelStarred={isChannelStarred}
                />

                <Segment>
                    <Comment.Group className="messages">
                        {searchTerm ? this.displayMessages(searchResults) : this.displayMessages(messages)}
                        <div ref={node => (this.messagesEnd = node)}></div>
                    </Comment.Group>
                </Segment>

                <MessageForm messagesRef={messagesRef} currentChannel={channel} currentUser={user} privateChannel={privateChannel} getMessagesRef={this.getMessagesRef} />
            </React.Fragment>
        )
    }
}

export default connect(null, {setUserPosts})(Messages)