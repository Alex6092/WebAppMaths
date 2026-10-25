// Andika : police dessinée pour les lecteurs débutants (licence SIL OFL). Le sous-ensemble
// « latin » couvre les accents, œ, € et le signe −.
import '@fontsource/andika/latin-400.css';
import '@fontsource/andika/latin-700.css';
import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
