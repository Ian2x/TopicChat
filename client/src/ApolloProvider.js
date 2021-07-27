import React from 'react'
import App from './App'
import ApolloClient from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { createHttpLink } from 'apollo-link-http'
import { ApolloProvider } from '@apollo/react-hooks'
import { setContext } from 'apollo-link-context'

import { onError } from 'apollo-link-error'

const errorLink = onError(({ graphQLErrors }) => {
    if (graphQLErrors) graphQLErrors.map(({ message }) => console.log(message))
})

const httpLink = createHttpLink({
    uri: 'http://localhost:5000'
})

const authLink = setContext(() => {
    const token = localStorage.getItem('jwtToken');
    return {
        headers: {
            Authorization: token ? `Bearer ${token}` : ''
        }
    }
})

const client = new ApolloClient({
    link: errorLink.concat(authLink.concat(httpLink)),
    cache: new InMemoryCache(),
    connectToDevTools: true,
    typeDefs: {}
})

export default (
    <ApolloProvider client={client}>
        <App/>
    </ApolloProvider>
) 

/*
import { ApolloClient, ApolloLink } from 'apollo-boost'
import { onError } from 'apollo-link-error'

const errorLink = onError(({ graphQLErrors }) => {
  if (graphQLErrors) graphQLErrors.map(({ message }) => console.log(message))
})

new ApolloClient({
  ...
  link: ApolloLink.from([errorLink, authLink, restLink, httpLink]),
})
*/