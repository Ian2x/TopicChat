import React, { useState, useContext } from 'react'
import { Button, List, Message } from 'semantic-ui-react';
import Modal from 'react-modal';
import moment from 'moment'


import styles from '../App.css';
import ReplyForm from './ReplyForm'
import { AuthContext } from '../context/auth'
import ReplyDeleteButton from '../components/ReplyDeleteButton'


function ReplyModal({ chat: { id: chatId, user: chatUserId, username, chat, replies }, keyword }) {

  const { user } = useContext(AuthContext);

  Modal.setAppElement('#root')

  const [showModal, setShowModal] = useState(false)

  function openModal() {
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Button onClick={() => openModal()} style={{ left: "50%" }}>
          Reply
        </Button>
      </div>
      <Modal
        className={styles.replyModal}
        isOpen={showModal}
        contentLabel="onRequestClose Example"
        onRequestClose={() => closeModal()}
        shouldCloseOnOverlayClick={true}
        style={{
          overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.75)'
          },
          content: {
            position: 'absolute',
            top: '200px',
            left: '200px',
            right: '200px',
            bottom: '200px',
            border: '1px solid #ccc',
            background: '#fff',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            borderRadius: '4px',
            outline: 'none',
            padding: '20px'
          }
        }}
      >
        <button onClick={() => closeModal()}>Back</button>
        <List divided relaxed style={{ height: '400px', overflow: 'scroll' }}>
          {
            replies.length > 0 && replies.map((reply) => (
              <List.Item key={reply.id}>
                <List.Content>
                  <Message color='teal'>
                    <Message.Item>
                      <div style={{ float: 'left' }}>
                        {reply.reply}
                      </div>
                      <div style={{ float: 'right' }}>
                        {reply.username}
                      </div>
                      <br />
                      <p>
                        {moment(reply.createdAt).fromNow()}
                      </p>
                    </Message.Item>
                  </Message>
                  {user && user.id === reply.user && (
                    <ReplyDeleteButton chatUserId={chatUserId} keyword={keyword} chatId={chatId} replyId={reply.id} replyUser={reply.user} />)}
                </List.Content>
              </List.Item>
            ))
          }
        </List>
        <ReplyForm chatUserId={chatUserId} keyword={keyword} chatId={chatId} />
      </Modal>
    </>
  )
}

export default ReplyModal
