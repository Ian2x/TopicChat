
import React, { useState, useContext } from 'react'
import { Input, Menu } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

import { AuthContext } from '../context/auth'
import TopicSearch from './TopicSearch'

function MenuBar() {
  const { user, logout } = useContext(AuthContext);
  const pathname = window.location.pathname;
  const path = pathname === '/' ? 'home' : pathname.substr(1);

  const [activeItem, setActiveItem] = useState(path); 

  const handleItemClick = (e, { name }) => setActiveItem(name);

  const menuBar = user ? (
    <Menu secondary size='massive' color='orange'>
      <Menu.Item
        name= { user.username}
        active
        as={Link}
        to={'/'}
      />
      <Menu.Menu position='right'>
        <Menu.Item>
          <TopicSearch/>
        </Menu.Item>
        <Menu.Item
          name='logout'
          onClick={logout}
        />
      </Menu.Menu>
    </Menu>
  ) : (
    <Menu secondary size='massive' color='orange'>
      <Menu.Item
        name='home'
        active={activeItem === 'home'}
        onClick={handleItemClick}
        as={Link}
        to={'/'}
      />
      <Menu.Menu position='right'>
        <Menu.Item>
          <Input icon='search' placeholder='Search...' />

        </Menu.Item>
        <Menu.Item
          name='login'
          active={activeItem === 'login'}
          onClick={handleItemClick}
          as={Link}
          to={'/login'}
        />
        <Menu.Item
          name='register'
          active={activeItem === 'register'}
          onClick={handleItemClick}
          as={Link}
          to={'/register'}
        />
      </Menu.Menu>
    </Menu>
  )

  return menuBar;
}

// <Input icon='search' placeholder='Search...' />

export default MenuBar;