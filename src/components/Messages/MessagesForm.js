import React, {Component} from 'react'
import uuidv4 from  'uuid/v4'
import {Button, Input, Segment} from 'semantic-ui-react'
import FileModal from './FileModal'
import ProgressBar from './ProgressBar'
import firebase from '../../firebase'
import {Picker, emojiIndex} from 'emoji-mart'
import 'emoji-mart/css/emoji-mart.css'

class MessageForm extends Component {
    constructor(props){
        super(props)

        this.state = {
            message: "",
            loading: false,
            channel: this.props.currentChannel,
            user: this.props.currentUser,
            errors: [],
            modal: false,
            uploadState: "",
            uploadTask: null,
            storageRef: firebase.storage().ref(),
            percentUpload: 0,
            emojiPicker: false
        }
    }

    componentWillUnmount(){
        if(this.state.uploadTask !== null){
            this.state.uploadTask.cancel()
            this.setState({uploadTask: null})
        }
    }

    openModal = () => this.setState({modal: true})

    closeModal = () => this.setState({modal: false})
    
        

    handleChange = (e) => {
        this.setState({[e.target.name] : e.target.value})
    }

    createMessage = (fileUrl = null) => {
        const message = {
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            user: {
                id: this.state.user.uid,
                name: this.state.user.displayName,
                avatar: this.state.user.photoURL
            },
        }

        if(fileUrl !== null){
            message['image'] = fileUrl
        }else{
            message['content'] = this.state.message
        } 

        console.log(message)
        return message
    }

    sendMessage = () => {
        const { getMessagesRef } = this.props
        const { message, channel } = this.state
        console.log("sendMEssage")

        if(message){
            this.setState({loading: true})
            getMessagesRef()
                .child(channel.id)
                .push()
                .set(this.createMessage())
                .then(() => {
                    this.setState({loading: false, message: "", errors: []})
                })
                .catch((err) => {
                    console.error(err)
                    this.setState({
                        loading: false,
                        errors: this.state.errors.concat(err)
                    })
                })
        }else{
            this.setState({
                errors: this.state.errors.concat({message: "Add a message"})
            })
        }
    }

    getPath = () => {
        if(this.props.privateChannel){
            return `chat/private/${this.state.channel.id}`
        }else{
            return 'chat/public'
        }
    }

    uploadFile = (file, metadata) => {
        const pathToUpload = this.state.channel.id;
        const ref = this.props.getMessagesRef();
        const filePath = `${this.getPath()}/${uuidv4()}.jpg`;
    
        this.setState(
          {
            uploadState: "uploading",
            uploadTask: this.state.storageRef.child(filePath).put(file, metadata)
          },
          () => {
            this.state.uploadTask.on(
              "state_changed",
              snap => {
                const percentUploaded = Math.round(
                  (snap.bytesTransferred / snap.totalBytes) * 100
                );
                this.setState({ percentUploaded });
              },
              err => {
                console.error(err);
                this.setState({
                  errors: this.state.errors.concat(err),
                  uploadState: "error",
                  uploadTask: null
                });
              },
              () => {
                this.state.uploadTask.snapshot.ref
                  .getDownloadURL()
                  .then(downloadUrl => {
                    this.sendFileMessage(downloadUrl, ref, pathToUpload);
                  })
                  .catch(err => {
                    console.error(err);
                    this.setState({
                      errors: this.state.errors.concat(err),
                      uploadState: "error",
                      uploadTask: null
                    });
                  });
              }
            );
          }
        );
      };


    sendFileMessage = (fileUrl, ref, pathToUpload) => {
        ref.child(pathToUpload)
            .push()
            .set(this.createMessage(fileUrl))
            .then(() => {
                this.setState({uploadState: 'done'})
            })
            .catch(err => {
                console.error(err)
                this.setState({
                    errors: this.state.errors.concat(err)
                })
            })

    }

    handleKeyDown = (e) => {

        if(e.keyCode === 13){
            this.sendMessage()
        }
    }

    handleTogglePicker = () => {
        this.setState({emojiPicker: !this.state.emojiPicker})
    }

    handleAddEmoji = (emoji) => {
        const oldMessage = this.state.message
        const newMessage = this.colonToUnicode(`${oldMessage} ${emoji.colons}`)
        this.setState({message: newMessage, emojiPicker: false})
        setTimeout(() => {
            this.messageInputRef.focus()
        }, 0)
    }

    colonToUnicode = message => {
        return message.replace(/:[A-Za-z0-9_+-]+:/g, x => {
          x = x.replace(/:/g, "");
          let emoji = emojiIndex.emojis[x];
          if (typeof emoji !== "undefined") {
            let unicode = emoji.native;
            if (typeof unicode !== "undefined") {
              return unicode;
            }
          }
          x = ":" + x + ":";
          return x;
        });
      };

    

    render(){

        const {errors, message, loading, modal, uploadState, percentUploaded, emojiPicker } = this.state

        return(
            <Segment className="message__form">
                {emojiPicker && (
                    <Picker
                        onSelect={this.handleAddEmoji} 
                        set="apple"
                        className="emojipicker"
                        title="Pick your emoji"
                        emoji="point_up"
                    />
                )}
                <Input 
                    fluid
                    name="message"
                    onChange={this.handleChange}
                    disabled={loading}
                    value={message}
                    ref={node => (this.messageInputRef = node)}
                    style={{marginBottom: '0.7em'}}
                    label={
                        <Button 
                            icon={emojiPicker ? 'close' : "add"} 
                            onClick={this.handleTogglePicker} 
                            content={emojiPicker ? 'Close' : null}
                        />}
                    labelPosition="left"
                    placeholder="Write your message"
                    className={
                        errors.some(error => error.message.includes('message')) ? 'error' : ""
                    }
                    onKeyDown={this.handleKeyDown}
                />

                <Button.Group icon widths="2">
                    <Button 
                        onClick={this.sendMessage}
                        color="orange"
                        content="Add Reply"
                        labelPosition="left"
                        icon="edit"
                    />
                    <Button 
                        color="teal"
                        disabled={uploadState === 'uploading'}
                        onClick={this.openModal}
                        content="Upload Media"
                        labelPosition="right"
                        icon="cloud upload"
                    />
                </Button.Group>
                <FileModal 
                    modal={modal} 
                    closeModal={this.closeModal}
                    uploadFile={this.uploadFile}
                />
                <ProgressBar 
                    uploadState={uploadState}
                    percentUploaded={percentUploaded}
                />
            </Segment>
        )
    }
}

export default MessageForm