import React, {Component} from 'react'
import {Grid, Form, Segment, Button, Header, Message, Icon, Divider} from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import firebase from '../../firebase'

class Login extends Component {
    constructor(props){
        super(props)

        this.state = {
            email: "",
            password: "",
            errors: [],
            loading: false,
        }

        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    guestLogin = () => {
        this.setState({email: "ryu@gmail.com", password: "password"})
    }

    handleChange(e){
        this.setState({[e.target.name]: e.target.value})
    }

    displayErrors(errors){
        return errors.map((error,i) => (
            <p key={i}>{error.message}</p>
        ))
    }
    
    handleSubmit(e){

        e.preventDefault()

        if(this.isFormValid(this.state)){
            this.setState({errors: [], loading: true})
            firebase
                .auth()
                .signInWithEmailAndPassword(this.state.email, this.state.password)
                .then(signedInUser => {
                })
                .catch(err => {
                    this.setState({
                        errors: this.state.errors.concat(err),
                        loading: false
                    })
                })
        }
    }

    isFormValid({email, password}){
        return email && password
    }

    handleInputError(errors,inputName){
        return errors.some(error => error.message.toLowerCase().includes(inputName)) ? 'error' : ''
    }

    render(){
        
        const {email, password, errors, loading} = this.state

        return(
            <Grid textAlign="center" verticalAlign="middle" className="app">
                <Grid.Column style={{maxWidth: 450}}>
                    <Header as="h1" icon color="violet" textAlign="center">
                        <Icon name="globe" color="violet" />
                        Login to GlobeChat
                    </Header>
                    <Form onSubmit={this.handleSubmit} size="large">
                        <Segment stacked>
                            <Form.Input 
                                fluid name="email" 
                                icon="mail" 
                                iconPosition="left"
                                placeholder="Email Address"
                                onChange={this.handleChange}
                                type="email"
                                value={email}
                                className={this.handleInputError(errors, 'email')}
                            />
                            <Form.Input 
                                fluid name="password" 
                                icon="lock" 
                                iconPosition="left"
                                placeholder="Password"
                                onChange={this.handleChange}
                                type="password"
                                value={password}
                                className={this.handleInputError(errors, 'password')}
                            />
                            <Button disabled={loading} className={loading ? 'loading' : ""} color="violet" fluid size="large">Submit</Button>
                            <Divider />
                            <Button disabled={loading} className={loading ? 'loading' : ""} color="violet" fluid size="large" onClick={this.guestLogin}>Guest Login</Button>
                        </Segment>
                    </Form>
                    {errors.length > 0 && (
                        <Message error>
                            <h3>Error</h3>
                            {this.displayErrors(errors)}
                        </Message>
                    )}
                    <Message>Dont have an account? <Link to="/register">Register</Link></Message>
                </Grid.Column>
            </Grid>
        )
    }
}

export default Login