import _ from 'lodash'
import React, {useContext} from 'react'
import gql from 'graphql-tag'
import { Search, Grid, Label, Icon, Container } from 'semantic-ui-react'
import { useQuery } from '@apollo/react-hooks'
import { Link } from 'react-router-dom'

import { AuthContext } from '../context/auth'

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

const resultRenderer = ({title, addedtopic, userid}) => {
  return (
    <Container as={Link} to={`/users/${userid}/${title}`}> 
      <Label>
        {title+' '}
      </Label>
      {addedtopic==='true' &&
        <Icon name='star' size='small' style={{float: 'right', marginTop: '7px'}}/>
      }
    </Container>
  )
}

function TopicSearch() {

  const { user } = useContext(AuthContext);

  const { loading: loadingSource, data } = useQuery(FETCH_ALL_SUGGESTED_TOPICS_QUERY, {
    variables: {
    },
  })
  var source = null
  if (!loadingSource) {
    ({ getAllSuggestedTopics: source } = data)
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

  source = source.map((topic)=>({"title": topic.keyword, "addedtopic": topic.addedTopic.toString(), "totalchats": topic.totalChats, "userid": user.id}))

  return (
    <Grid>
      <Grid.Column width={6}>
        <Search
          loading={loading}
          onResultSelect={(e, data) =>
            dispatch({ type: 'UPDATE_SELECTION', selection: data.result.title })
          }
          onSearchChange={handleSearchChange}
          resultRenderer={resultRenderer}
          results={results}
          value={value}
        />
      </Grid.Column>

    </Grid>
  )
}

const FETCH_ALL_SUGGESTED_TOPICS_QUERY = gql`
    query getAllSuggestedTopics {
        getAllSuggestedTopics {
          keyword
          addedTopic
          totalChats
        }
    }
`

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

export default TopicSearch