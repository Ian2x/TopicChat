import React, { useState } from 'react'
import gql from 'graphql-tag'
import { useMutation } from '@apollo/react-hooks'

import { Button, Icon, Confirm, Popup } from 'semantic-ui-react'

import { FETCH_USER_QUERY } from '../util/graphql'

const _ = require('lodash');

function FriendDeleteButton({ userId, friendId }) {
    const [confirmOpen, setConfirmOpen] = useState(false)

    const [deleteTopic] = useMutation(DELETE_FRIEND_MUTATION, {
        update(proxy) {
            setConfirmOpen(false)
            
            const data = _.cloneDeep(
            proxy.readQuery({
                query: FETCH_USER_QUERY,
                variables: {
                    userId
                }
            })
            )
            
            data.getUser.friends = [...data.getUser.friends.filter(f => String(f.userId) !== String(friendId))]
            
            proxy.writeQuery({
                query: FETCH_USER_QUERY,
                data,
                variables: {
                    userId
                }
            })
        },
        variables: {
            friendId
        },

        onError(err) {
            throw new Error(err)
        },
        
        refetchQueries: [
            {
                query: FETCH_USER_QUERY
                ,
                variables: { userId}
            }
        ]
        
    })

    return (
        <div>
            <Popup content="Remove friend" inverted trigger={
                <Button as='div' color='red' style={{ marginLeft: 'auto' }} onClick={() => setConfirmOpen(true)}>
                    <Icon name='trash' style={{ margin: 0 }} />
                </Button>
            } />
            <Confirm
                open={confirmOpen}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={deleteTopic}
            />
        </div>
    )

}

const DELETE_FRIEND_MUTATION = gql`
    mutation removeFriend($friendId: ID!) {
        removeFriend(friendId: $friendId)
    }
`

export default FriendDeleteButton