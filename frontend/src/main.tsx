// main.tsx - Ponto de entrada da aplicação
// É como o "interruptor principal" que liga toda a aplicação
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './App.css' // ADICIONADO: Import do tema rosa

// Busca o elemento HTML com id 'root' no index.html
// É onde nossa aplicação React vai ser "montada"
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* StrictMode: Modo de desenvolvimento que ajuda a encontrar bugs */}
    <App />
  </React.StrictMode>,
)