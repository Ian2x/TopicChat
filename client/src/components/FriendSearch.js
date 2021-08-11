import _ from 'lodash'
import React, { useContext } from 'react'
import { Search, Grid, Label, Container } from 'semantic-ui-react'
import { useQuery} from '@apollo/react-hooks'
import { Link } from 'react-router-dom'

import { AuthContext } from '../context/auth'
import { FETCH_ALL_USERS_QUERY } from '../util/graphql'
// import FriendSearchAddButton from './FriendSearchAddButton'

const initialState = {
    loading: false,
    results: [],
    value: '',
}

function exampleReducer(state, action) {
    switch (action.type) {
        case 'CLEAN_QUERY':
            return initialState
        case 'START_SEARCH':
            return { ...state, loading: true, value: action.query }
        case 'FINISH_SEARCH':
            return { ...state, loading: false, results: action.results }
        case 'UPDATE_SELECTION':
            return { ...state, value: action.selection }

        default:
            throw new Error()
    }
}

const ResultRenderer = ({ title, friendid, friends, friendrequests, viewerid }) => {
    if (friendid===viewerid) {
        return (
            <Container>
                <Label>
                    {title + ' '}
                </Label>
                <div style={{float: 'right', marginTop: '4px'}}>
                    (self)
                </div>
            </Container>
        )
    }

    const friendRequestSent = friendrequests.some(friend => friend.userId===viewerid)
    const alreadyFriends = friends.some(friend => friend.userId===viewerid)
    /*
    const handleClick = e => {
        if (e.target.tagName==='DIV'){
            window.location.href=`/users/${friendid}`
        }
    }
    */

    // <Container as={Link} to={`/users/${friendid}`}>
    return (
        <Container as={Link} to={`/users/${friendid}`}>
            <Label>
                {title + ' '}
            </Label>
            {friendRequestSent && (
                <div style={{float: 'right', marginTop: '4px'}}>
                    friend request sent
                </div>
            )}
            {alreadyFriends && (
                <div style={{float: 'right', marginTop: '4px'}}>
                    friends!
                </div>
            )}
        </Container>
    )
    /*
        {!friendRequestSent && !alreadyFriends && (
            <FriendSearchAddButton friendUsername={title} friendId={friendid}/>
        )}
    */
}

function FriendSearch() {

    const { user: viewer } = useContext(AuthContext);

    const { loading: loadingSource, data } = useQuery(FETCH_ALL_USERS_QUERY, {
        variables: {},
    })
    var source = null
    if (!loadingSource) {
        ({ getAllUsers: source } = data)
    }

    const [state, dispatch] = React.useReducer(exampleReducer, initialState)
    const { loading, results, value } = state

    const timeoutRef = React.useRef()
    const handleSearchChange = React.useCallback((e, data) => {
        clearTimeout(timeoutRef.current)
        dispatch({ type: 'START_SEARCH', query: data.value })

        timeoutRef.current = setTimeout(() => {
            if (data.value.length === 0) {
                dispatch({ type: 'CLEAN_QUERY' })
                return
            }

            const re = new RegExp(_.escapeRegExp(data.value), 'i')
            const isMatch = (result) => re.test(result.title)

            dispatch({
                type: 'FINISH_SEARCH',
                results: _.filter(source, isMatch),
            })
        }, 300)
    }, [source])
    React.useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current)
        }
    }, [])

    if (loadingSource) {
        return (
            <Grid>
                <Grid.Column width={6}>
                    <Search
                        value={'loading...'}
                    />
                </Grid.Column>
            </Grid>
        )
    }
    source = source.map((user) => ({ "title": user.username, "friendid": String(user.id), "friends": user.friends, "friendrequests": user.friendRequests, "viewerid": viewer.id}))
    return (
        <Grid>
            <Grid.Column width={6}>
                <Search
                    loading={loading}
                    onResultSelect={(e, data) =>
                        dispatch({ type: 'UPDATE_SELECTION', selection: data.result.title })
                    }
                    onSearchChange={handleSearchChange}
                    resultRenderer={ResultRenderer}
                    results={results}
                    value={value}
                    onSelect={()=>false}
                />
            </Grid.Column>

        </Grid>
    )
}

/*
      <Grid.Column width={10}>
        <Segment>
          <Header>State</Header>
          <pre style={{ overflowX: 'auto' }}>
            {JSON.stringify({ loading, results, value }, null, 2)}
          </pre>
          <Header>Options</Header>
          <pre style={{ overflowX: 'auto' }}>
            {JSON.stringify(source, null, 2)}
          </pre>
        </Segment>
      </Grid.Column>
*/

export default FriendSearch