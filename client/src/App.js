import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Container } from 'semantic-ui-react';

import 'semantic-ui-css/semantic.min.css';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import './App.css';

import { AuthProvider } from './context/auth';
import AuthRoute from './util/AuthRoute';

import MenuBar from './components/MenuBar';
import Home from './pages/Home';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfile from './pages/UserProfile';
import GroupChat from './pages/GroupChat';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Container >
          <MenuBar />
          <Route exact path='/home' component= {Home}/>
          <Route exact path='/' component={HomePage} />
          <AuthRoute exact path='/login' component={Login} />
          <AuthRoute exact path='/register' component={Register} />
          <Route exact path='/users/:userId' component={UserProfile}/>
          <Route exact path='/users/:userId/:keyword' component={GroupChat}/>
        </Container>
      </Router>
    </AuthProvider>
  );
}

export default App;