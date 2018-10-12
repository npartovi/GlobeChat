import React, {Component} from 'react'
import {Grid, Header, Icon, Dropdown, Image, Modal, Input, Button, Divider} from 'semantic-ui-react'
import firebase from '../../firebase'
import {connect} from 'react-redux'
import AvatarEditor from "react-avatar-editor"

class UserPanel extends Component{

    constructor(props){
        super(props)

        this.state = {
            user: this.props.currentUser,
            modal: false,
            previewImage: "",
            croppedImage: "",
            blob: "",
            storageRef: firebase.storage().ref(),
            userRef: firebase.auth().currentUser,
            usersRef: firebase.database().ref('users'),
            metaData: {
                contentType: 'image/jpg'
            },
            uploadCroppedImage: ""
        }
    }

    openModal = () => this.setState({modal: true})

    closeModal = () => this.setState({modal: false})

    dropdownOptions = () => [

        {
            key: "user",
            text: <span>Sign in as <strong>{this.state.user.displayName}</strong></span>,
            disabled: true
        },
        {
            key: "avatar",
            text: <span onClick={this.openModal}>Change Avatar</span>
        },
        {
            key: "signout",
            text: <span onClick={this.handleSignout}>Sign Out</span>
        }
    ]

    uploadCroppedImage = () => {

        const { storageRef, blob, userRef, metaData} = this.state

        storageRef
            .child(`avatars/user/${userRef.uid}`)
            .put(blob, metaData )
            .then(snap => {
                snap.ref.getDownloadURL()
                    .then(downloadURL => {
                        this.setState({uploadedCroppedImage: downloadURL}, () => {
                            this.changeAvatar()
                        })
                    })
            })
    }

    changeAvatar = () => {
        this.state.userRef
            .updateProfile({
                photoURL: this.state.uploadedCroppedImage
            })
            .then(() => {
                this.closeModal()
            })
            .catch((err) => {
                console.error(err)
            })

        this.state.usersRef
            .child(this.state.user.uid)
            .update({avatar: this.state.uploadedCroppedImage})
           
    }

    handleSignout = () => {
        firebase
            .auth()
            .signOut()
    }

    handleChange = (e) => {
        const file = e.target.files[0]
        const reader = new FileReader()

        if(file){
            reader.readAsDataURL(file)
            reader.addEventListener('load',() => {
                this.setState({previewImage: reader.result})
            })
        }
    }

    handleCropImage = () => {
        if(this.avatarEditor){
            this.avatarEditor.getImageScaledToCanvas().toBlob(blob => {
                let imageUrl = URL.createObjectURL(blob)
                this.setState({
                    croppedImage: imageUrl,
                    blob
                })
            })
        }
    }

    render(){

        const { user, modal, previewImage, croppedImage } = this.state

        const {primaryColor} = this.props
        
        return(
            <Grid style={{background: primaryColor}}>
                <Grid.Column>
                    <Grid.Row style={{padding: '1.2em', margin: 0}}>
                        <Header inverted floated="left" as="h3">
                            <Icon name="globe" />
                            <Header.Content>
                                Globe Chat
                            </Header.Content>
                            <Divider />
                        </Header>
                        <Header style={{padding: '0.25em'}} as="h4" inverted>
                            <Dropdown 
                                trigger={
                                    <span>
                                        <Image src={user.photoURL} spaced="right" avatar />
                                        {user.displayName}
                                    </span>
                                } 
                                options={this.dropdownOptions()} />
                        </Header>
                    </Grid.Row>
                    
                    <Modal basic open={modal} onClose={this.closeModal}>
                            <Modal.Header>Change Avatar</Modal.Header>
                            <Modal.Content>
                                <Input
                                    onChange={this.handleChange} 
                                    fluid 
                                    type="file"
                                    label="New Avatar"
                                    name="previewImage"
                                />
                                <Grid centered stackable columns={2}>
                                    <Grid.Row centered>
                                        <Grid.Column className="ui center aligned grid">
                                            {previewImage && (
                                                <AvatarEditor
                                                    image={previewImage}
                                                    width={120}
                                                    height={120}
                                                    border={50}
                                                    scale={1.2}
                                                    ref={node => (this.avatarEditor = node)}
                                                />
                                            )}
                                        </Grid.Column>
                                        <Grid.Column>
                                            {croppedImage && (
                                                <Image 
                                                    style={{margin: '3.5em auto'}}
                                                    width={100}
                                                    height={100}
                                                    src={croppedImage}
                                                />
                                            )}
                                        </Grid.Column>
                                    </Grid.Row>
                                </Grid>
                            </Modal.Content>
                            <Modal.Actions>
                                {croppedImage && (<Button color="green" inverted onClick={this.uploadCroppedImage}>
                                    <Icon name="save" /> Change Avatar
                                </Button>)}
                                <Button color="green" inverted onClick={this.handleCropImage}>
                                    <Icon name="image" /> Preview
                                </Button>
                                <Button color="red" inverted onClick={this.closeModal}>
                                    <Icon name="remove" /> Cancel
                                </Button>
                            </Modal.Actions>
                    </Modal>

                </Grid.Column>
            </Grid>
        )
    }
}

const mapStateToProps = (state) => ({
    user: state.user.currentUser
})

export default connect(mapStateToProps, null)(UserPanel)