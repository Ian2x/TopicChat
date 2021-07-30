import React, { useState } from 'react'
import { Button } from 'semantic-ui-react';
import Modal from 'react-modal';


function ReplyModal({ chat: {id, user, username, chat, replies}, keyword, replierId }) {

    Modal.setAppElement('#root')

    const [showModal, setShowModal] = useState(false)

    function openModal() {
        setShowModal(true)
    }

    function closeModal() {
        setShowModal(false)
    }

    return(
        <>
            <Button onClick={()=>openModal()}>
                Reply
            </Button>
            <Modal 
                isOpen={showModal}
                contentLabel="onRequestClose Example"
                onRequestClose={()=>closeModal()}
                shouldCloseOnOverlayClick={true}
            >
                <p>Modal text!</p>
                <button onClick={()=>closeModal()}>Close Modal</button>
            </Modal>
        </>
    )
}

// replyToChat(chatUserId: ID!, keyword: String!, chatId: ID!, reply: String!): ChatReply!

export default ReplyModal

/*
ReactModal.setAppElement('#main');

class ExampleApp extends React.Component {
  constructor () {
    super();
    this.state = {
      showModal: false
    };
    
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
  }
  
  handleOpenModal () {
    this.setState({ showModal: true });
  }
  
  handleCloseModal () {
    this.setState({ showModal: false });
  }
  
  render () {
    return (
      <div>
        <button onClick={this.handleOpenModal}>Trigger Modal</button>
        <ReactModal 
           isOpen={this.state.showModal}
           contentLabel="onRequestClose Example"
           onRequestClose={this.handleCloseModal}
           shouldCloseOnOverlayClick={true}
        >
          <p>Modal text!</p>
          <button onClick={this.handleCloseModal}>Close Modal</button>
        </ReactModal>
      </div>
    );
  }
}

const props = {};

ReactDOM.render(<ExampleApp {...props} />, document.getElementById('main'))
*/