import React, { useContext } from 'react'
import { useQuery } from '@apollo/react-hooks'

import gql from 'graphql-tag'


function ChatFeed() {

    const { loading, data } = useQuery(FETCH_USER_FEED_QUERY, {
        variables: { },
    })

    if (loadingUser) return 'Loading user...';

    return (
        <>
        </>
    )
}


const FETCH_USER_FEED_QUERY = gql`
    mutation getUserFeed {
        getUserFeed {
            id
        user
        username
        replies {
            id
            user
            username
            reply
            createdAt
        }
        replyCount
        chat
        createdAt
        parentTopic
        }
    }
`

export default FriendDeleteButton