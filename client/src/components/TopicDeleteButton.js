import React, { useState } from 'react'
import gql from 'graphql-tag'
import { useMutation } from '@apollo/react-hooks'

import { Button, Icon, Confirm, Popup } from 'semantic-ui-react'

import { FETCH_USER_QUERY } from '../util/graphql'

const _ = require('lodash');

function DeleteButton({ keyword, userId }) {
    const [confirmOpen, setConfirmOpen] = useState(false)

    const [deleteTopic] = useMutation(DELETE_TOPIC_MUTATION, {
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
            const toBeEvicted = data.getUser.topics.filter(t => String(t.keyword) === String(keyword))[0]
            console.log(keyword)
            console.log(data)
            
            data.getUser.topics = [...data.getUser.topics.filter(t => String(t.keyword) !== String(keyword))]
            console.log(data.getUser.topics)
            
            proxy.writeQuery({
                query: FETCH_USER_QUERY,
                data,
                variables: {
                    userId
                }
            })
            /*
            proxy.modify({
                id: userId,
                fields: {
                    topics(existingTopics, { readField }) {
                      return existingTopics.filter(
                        topicRef => keyword !== readField('keyword', topicRef)
                      );
                    },
                }
            })
            */
           /*
           proxy.evict({id: 'User:60fb1119c07ae7131c54346f.topics.2'})
           */
          /*
          proxy.refetchQueries: [{

          }]
          */
        },
        variables: {
            keyword
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
        <>
            <Popup content="Delete topic" inverted trigger={
                <Button as='div' color='red' style={{ marginLeft: 'auto' }} onClick={() => setConfirmOpen(true)}>
                    <Icon name='trash' style={{ margin: 0 }} />
                </Button>
            } />
            <Confirm
                open={confirmOpen}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={deleteTopic}
            />
        </>
    )

}

const DELETE_TOPIC_MUTATION = gql`
    mutation deleteTopic($keyword: String!) {
        deleteTopic(keyword: $keyword)
    }
`

export default DeleteButton