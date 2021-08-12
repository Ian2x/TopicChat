import gql from 'graphql-tag'

export const FETCH_ALL_USERS_QUERY = gql`
    query getAllUsers {
        getAllUsers {
            id
            username
            topics {
                keyword
                chats {
                    id
                    user
                    username
                    chat
                    replies {
                        id
                        user
                        username
                        reply
                        createdAt
                    }
                    replyCount
                    createdAt
                    parentTopic
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
                username
                chat
                replies {
                    id
                    user
                    username
                    reply
                    createdAt
                }
                replyCount
                createdAt
                parentTopic
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
        chat
        replies {
            id
            user
            username
            reply
            createdAt
        }
        replyCount
        createdAt
        parentTopic
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
            replies {
                id
                user
                username
                reply
                createdAt
            }
            replyCount
            createdAt
            parentTopic
        }
        chatCount
    }
}
`