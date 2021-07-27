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
