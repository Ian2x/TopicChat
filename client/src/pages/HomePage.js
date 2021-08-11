import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
//import { Grid } from 'semantic-ui-react';
import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom'


import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';


//import UserCard from '../components/UserCard';

const containerStyle={
    backgroundImage: "url(" + "https://wallpapercave.com/wp/wp7857641.jpg" + ")",
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            width:'100vw',
            height:'100vh',
            paddingRight:'0',
            paddingLeft:'0',
            marginRight:'0',
            marginLeft:'0',
}

const buttonStyle={

}

function relocate_home(String)
{
    //to="/login";
} 


function HomePage() {

    return (

        <Container style={containerStyle}>

              <div class="p-5 text-center rounded mt-10 text-white align left" style={{  //why does text-green/black not work?
                fontSize:'30px',
                fontFamily:'Inter',
              }} >
                <div class="row top-buffer">
                    <h1 class="d-flex jupull-stify-content-left" > Explore the Internet.</h1>
                    <p class="d-flex jupull-stify-content-left">
                        Connect with people on hobbies, games, stocks, memes, and more
                    </p>
                    <Button variant="outline-primary" style={buttonStyle} href="http://localhost:3000/Login">Login</Button>{' '}
                    <Button variant="outline-secondary" style={buttonStyle} href="http://localhost:3000/Register">Sign Up</Button>{' '}
                    <Button variant="outline-success" style={buttonStyle} href="http://localhost:3000/Home">Explore</Button>{' '}
                </div>
              </div>
            
              <Link to="/login">About</Link>


        </Container>
            )
}

            const FETCH_USERS_QUERY = gql`
            {
                getUsers{
                id
            actualName
            email
            username
            createdAt
            userPic
        }
    }
            `

export default HomePage;