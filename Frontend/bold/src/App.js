import './App.css';
import { BrowserRouter, Route, Switch } from "react-router-dom"
import Cart from './components/Cart';
import NavBar from './components/NavBar';
import Home from './components/Home'

function App() {
  return (<div className="App">
    <BrowserRouter>
    <NavBar/>
    <Switch>
        <Route path="/cart" component={Cart}/>
        <Route path="/" exact component={Home}/>
    </Switch>
    </BrowserRouter>
  </div>
  );
}

export default App;
