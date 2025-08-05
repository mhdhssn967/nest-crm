import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './ChatAI.css'
import aiimg from '../assets/wavebot.gif'
import ai3 from '../assets/ai2.png'
import Typing from './Typing';
import callout from '../assets/callout.png'

const ChatAI = ({ companyId }) => {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openChat,setOpenChat] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = { sender: 'user', text: message };
    setChatLog(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await axios.post(`https://crm-ai-chat.onrender.com/chat/${companyId}`, {
        message,
      });

      const aiReply = response.data.response || 'No response from AI.';
      setChatLog(prev => [...prev, { sender: 'ai', text: aiReply }]);
    } catch (error) {
      setChatLog(prev => [...prev, { sender: 'ai', text: '❌ Error contacting AI.' }]);
    }

    setMessage('');
    setLoading(false);
  };

  return (

    <div>
        <button onClick={()=>setOpenChat(true)} className='ask-ai-btn'> 
            {!openChat?<img className='click-ai' width={'50px'} src={ai3} alt="" />:<></>}
        </button>
      {openChat&&<div style={styles.container} className='chat-container'>
        
        <div className='chat-container-head'>
          <h3 className='smart-head'> Oqulix Smart Assistant</h3>
<button onClick={()=>setOpenChat(false)}>
            <i  class="fa-solid fa-circle-xmark"></i>
  
</button>        </div>
        <div style={styles.chatBox}>
          {chatLog.length>0?<>
            {chatLog.map((msg, i) => (
              <div className='common-chat' key={i} style={msg.sender === 'user' ? styles.userMsg : styles.aiMsg}>
                {msg.sender=='user'?<i style={{fontSize:'20px'}} class="fa-solid fa-user-tie"></i>:
                <img width={'30px'} src={ai3} alt="" />
                }
                <div className={msg.sender === 'user' ? 'user-txt' : 'ai-txt'}>
  <ReactMarkdown>{msg.text}</ReactMarkdown>
</div>

              </div>
            ))}
            {loading && <div style={styles.aiMsg}><img width={'20px'} src={ai3} alt="" /><Typing/>
</div>}
          </>:
          <>
          <div className='empty-chat'>
            <img width={'260px'} src={aiimg} alt="" />
            <img className='callout' width={'300px'} src={callout} alt="" />
           </div>
          </>}
        </div>
        <div style={styles.inputArea}>
          <input
            style={styles.input}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your question..."
          />
          <button className='send-btn' style={styles.button} onClick={handleSend} disabled={loading}>
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>}
      
    </div>
  );
};

// 🖌️ Styled for clarity
const styles = {
  container: {
    maxWidth: '90vw',
    margin: '2rem auto',
    padding: '1rem',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    height:'600px'
  },
  chatBox: {
    minHeight: '200px',
    maxHeight: '470px',
    overflowY: 'auto',
    padding: '0.5rem',
    backgroundColor: '#eaeaebff',
    marginBottom: '1rem',
    borderRadius: '6px',
    display:'flex',
    flexDirection:'column'
  },
  userMsg: {
    textAlign: 'right',
    margin: '0.5rem 0',
    padding: '0.5rem',
    borderRadius: '6px',
    width:'fit-content',
    height:'fit-content',
    alignSelf:'end',
    display:'flex',
    flexDirection:'row-reverse',
    
  },
  aiMsg: {
    textAlign: 'left',
    margin: '0.5rem 0',
    padding: '0.5rem',
    borderRadius: '6px',
    width:'fit-content',
    height:'fit-content',
    alignSelf:'start'
  },
  inputArea: {
    display: 'flex',
    gap: '0.5rem',
  },
  input: {
    flex: 1,
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  button:{
    backgorund:'none',
    border:'none',

    width:'55px',
    color:'rgb(0, 64, 124)',
    borderRadius:'10px'
  }
 
};

export default ChatAI;
