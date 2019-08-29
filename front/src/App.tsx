import React, {useState, useEffect} from "react";
import "./App.css";
import Home from "./components/Home";
import {getResumes, Resumes} from "./api/api"

const App: React.FC = () => {

  const [resumes, setResumes] = useState()
  const loadResumes =  async() => setResumes(await getResumes());
  
  useEffect(() => {
    loadResumes()
  })

  console.log(`resumes : ${resumes}`)
  if(!resumes) return <p>Chargement des CV</p>
  return <Home {...resumes}></Home>
  // return <p>Chargement des CV</p>
};

export default App;
