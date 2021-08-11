import React, { useContext, useState } from 'react'
import { Button, Container } from 'semantic-ui-react'
import { useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'

import { AuthContext } from '../context/auth'

function AcceptRejectFriend({friendUsername, friendId}) {

    const { user } = useContext(AuthContext);

    const [showButtons, setShowButtons] = useState('true');

    const [acceptFriendRequest] = useMutation(ACCEPT_FRIEND_REQUEST_MUTATION, {
        /*
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
        */
        variables: {
            'friendUsername': friendUsername,
            'friendId': friendId
        },
    })

    const [rejectFriendRequest] = useMutation(REJECT_FRIEND_REQUEST_MUTATION, {
        variables: {
            'friendId': friendId
        },
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