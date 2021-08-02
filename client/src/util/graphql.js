import gql from 'graphql-tag'

export const FETCH_USER_QUERY = gql`
query getUser($userId: ID!) {
    getUser(userId: $userId) {
        id
        username
        topics {
            keyword
            chats {
                id
                user
                chat
                replies {
                    user
                    reply
                    createdAt
                }
                createdAt
            }
            chatCount
        }
        friends
        friendRequests
        createdAt
    }
}
`

export const FETCH_GROUP_CHAT_QUERY = gql`
query getGroupChat($keyword: String!) {
    getGroupChat(keyword: $keyword) {
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
        chat
        createdAt
    }
}
`