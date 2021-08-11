import React, { useContext, useState } from 'react'
import { Button, Container } from 'semantic-ui-react'
import { useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'

import { AuthContext } from '../context/auth'
import { FETCH_USER_QUERY } from '../util/graphql'

const _ = require('lodash');

function AcceptRejectFriend({friendUsername, friendId}) {

    const { user } = useContext(AuthContext);

    const [showButtons, setShowButtons] = useState('true');

    const [acceptFriendRequest] = useMutation(ACCEPT_FRIEND_REQUEST_MUTATION, {    
        update(proxy) {
            const data = _.cloneDeep(
                proxy.readQuery({
                    query: FETCH_USER_QUERY,
                    variables: {
                        userId: user.id
                    },
                })
            )
            data.getUser.friendRequests = data.getUser.friendRequests.filter(fr=>fr.userId!==friendId)
            data.getUser.friends = [...data.getUser.friends, { 'username': friendUsername, 'userId': friendId }]

            proxy.writeQuery({
                query: FETCH_USER_QUERY,
                data,
                variables: {
                    userId: user.id
                }
            })
        },
        variables: {
            'friendUsername': friendUsername,
            'friendId': friendId
        },
        refetchQueries: [
            {
                query: FETCH_USER_QUERY,
                variables: {userId: user.id}
            }
        ]
    })

    const [rejectFriendRequest] = useMutation(REJECT_FRIEND_REQUEST_MUTATION, {
        update(proxy) {
            const data = _.cloneDeep(
                proxy.readQuery({
                    query: FETCH_USER_QUERY,
                    variables: {
                        userId: user.id
                    },
                })
            )
            data.getUser.friendRequests = data.getUser.friendRequests.filter(fr=>fr.userId!==friendId)

            proxy.writeQuery({
                query: FETCH_USER_QUERY,
                data,
                variables: {
                    userId: user.id
                }
            })
        },
        variables: {
            'friendId': friendId
        },
        refetchQueries: [
            {
                query: FETCH_USER_QUERY,
                variables: {userId: user.id}
            }
        ]
    })

    const handleAccept = e => {
        setShowButtons('accept')
        acceptFriendRequest()
    }

    const handleReject = e => {
        setShowButtons('reject')
        rejectFriendRequest()
    }

    return (
        <Container>
            <h1>
                {friendUsername}
            </h1>
            {showButtons==='true' && (
                <>
                    <Button onClick={handleAccept}>
                        Accept friend request
                    </Button>
                    <Button onClick={handleReject}>
                        Reject friend request
                    </Button>
                </>
            )}
            {showButtons==='accept' && (
                <p>
                    friend request from {friendUsername} accepted
                </p>
            )}
            {showButtons==='reject' && (
                <p>
                    friend request from {friendUsername} rejected
                </p>
            )}
        </Container>
    )

}

const ACCEPT_FRIEND_REQUEST_MUTATION = gql`
mutation acceptFriendRequest($friendUsername: String!, $friendId: ID!) {
    acceptFriendRequest(friendUsername: $friendUsername, friendId: $friendId)
}
`

const REJECT_FRIEND_REQUEST_MUTATION = gql`
mutation rejectFriendRequest($friendId: ID!) {
    rejectFriendRequest(friendId: $friendId)
}
`

export default AcceptRejectFriend