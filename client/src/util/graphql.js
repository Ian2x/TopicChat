import gql from 'graphql-tag'

export const FETCH_ALL_USERS_QUERY = gql`
    query getAllUsers {
        getAllUsers {
            id
            username
            topics {
                chats {
                    chat
                }
            }
            friends {
                username
                userId
            }
            friendRequests {
                username
                userId
            }
            createdAt
        }
    }
`

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
        friends {
            username
            userId
        }
        friendRequests {
            username
            userId
        }
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

export const CREATE_TOPIC_MUTATION = gql`
mutation createTopic($keyword: String!) {
    createTopic(keyword: $keyword) {
        id
        keyword
        chats {
            id
            user
            username
            chat
            replies
            replyCount
            createdAt
            parentTopic
        }
        chatCount
    }
}
`