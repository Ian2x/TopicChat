import React from 'react'
import { Card, Image } from 'semantic-ui-react'
import moment from 'moment'
import { Link } from 'react-router-dom'

function UserCard({ user: { id, username, createdAt } }) {

    return (
        <Card fluid>
            <Image src='https://react.semantic-ui.com/images/avatar/large/matthew.png' wrapped ui={false} />
            <Card.Content>
                <Card.Header as={Link} to={`/users/${id}`}> {username} </Card.Header>
                <Card.Meta>
                    user created {moment(createdAt).fromNow()}
                </Card.Meta>
            </Card.Content>
        </Card>
    )
}

export default UserCard
