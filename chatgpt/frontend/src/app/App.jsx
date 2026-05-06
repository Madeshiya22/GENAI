import { RouterProvider } from 'react-router-dom'
import { routes } from './app.routes'
import './App.css'
import { Provider } from 'react-redux'
import { store } from './app.store'

function App() {


  return (
    <Provider store={store}>
      <RouterProvider router={routes} />
    </Provider>
  )
}

export default App