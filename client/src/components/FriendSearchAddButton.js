import React, { useContext, useState } from 'react'
import { Button } from 'semantic-ui-react'
import { useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'

import { AuthContext } from '../context/auth'
import { FETCH_ALL_USERS_QUERY } from '../util/graphql'

const _ = require('lodash');


function FriendSearchAddButton({ friendUsername, friendId, friendRequestSent, alreadyFriends }) {

    const { user } = useContext(AuthContext);

    const [showButton, setShowButton] = useState(true);

    const [sendFriendRequest] = useMutation(SEND_FRIEND_REQUEST_MUTATION, {
        update(proxy) {
            const data = _.cloneDeep(
                proxy.readQuery({
                    query: FETCH_ALL_USERS_QUERY,
                    variables: {}
                })
            )
            console.log(data)
            const index = data.getAllUsers.findIndex((user) => user.id === friendId)
            data.getAllUsers[index].friendRequests = [...data.getAllUsers[index].friendRequests, { "username": user.username, "userId": user.id }]
            console.log(data)

            proxy.writeQuery({
                query: FETCH_ALL_USERS_QUERY,
                data,
                variables: {}
            })
        },
        variables: {
            'friendUsername': friendUsername,
            'friendId': friendId
        },
    })
    
    const handleClick = e => {
        // e.stopPropagation()
        setShowButton(false)
        sendFriendRequest()
    }

    return (
        <>
            {showButton && !friendRequestSent && !alreadyFriends && (
                < Button size='mini' style={{ float: 'right' }} onClick={handleClick}>
                    add friend
                </Button >
            )}
            {(!showButton || friendRequestSent) && (
                <p>
                    Friend request sent...
                </p>
            )}
            {alreadyFriends && (
                <p>
                    Friends
                </p>
            )}
        </>
    )
}

const SEND_FRIEND_REQUEST_MUTATION = gql`
mutation sendFriendRequest($friendUsername: String!, $friendId: ID!) {
    sendFriendRequest(friendUsername: $friendUsername, friendId: $friendId)
}
`

export default FriendSearchAddButton