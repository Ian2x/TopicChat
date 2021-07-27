import React, { useContext } from 'react'
import { Card } from 'semantic-ui-react'

import { AuthContext } from '../context/auth'
import TopicDeleteButton from './TopicDeleteButton'

function TopicCard({ topic: { keyword }, topicCreatorId }) {

    const { user } = useContext(AuthContext)
    return (
        <Card fluid>
            <Card.Content>
                {keyword}
            </Card.Content>
            <Card.Content>
                <Card.Description style={{ display: "flex" }}>
                    {user && user.id === topicCreatorId && (
                        <TopicDeleteButton keyword={keyword} userId={user.id} />)}
                </Card.Description>
            </Card.Content>
        </Card>
    )
}
// as={Link} to={link}
export default TopicCard
