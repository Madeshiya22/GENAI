import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWABadge() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) {
    return null
  }

  return (
    <div style={styles.container}>
      <div style={styles.message}>
        { offlineReady
          ? <span>App ready to work offline</span>
          : <span>New content available, click on reload button to update.</span>
        }
      </div>
      <div style={styles.buttons}>
        { needRefresh && <button style={styles.button} onClick={() => updateServiceWorker(true)}>Reload</button> }
        <button style={styles.buttonAlt} onClick={() => close()}>Close</button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    padding: '16px',
    border: '1px solid rgba(134, 59, 255, 0.3)',
    borderRadius: '8px',
    backgroundColor: '#0a0a0a',
    color: '#fff',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    fontFamily: 'Inter, sans-serif',
    maxWidth: '300px'
  },
  message: {
    fontSize: '14px',
    lineHeight: '1.5'
  },
  buttons: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end'
  },
  button: {
    padding: '6px 16px',
    border: 'none',
    backgroundColor: '#863bff',
    color: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  buttonAlt: {
    padding: '6px 16px',
    border: '1px solid rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
    color: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
}
