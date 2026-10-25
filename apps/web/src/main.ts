// Andika : police dessinée pour les lecteurs débutants (licence SIL OFL). Le sous-ensemble
// « latin » couvre les accents, œ, € et le signe −.
import '@fontsource/andika/latin-400.css';
import '@fontsource/andika/latin-700.css';
// Emoji embarqués : la police emoji de Windows 8.1 (tablette d'Océane) ne les a pas tous.
import './emoji/emoji.css';
import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
