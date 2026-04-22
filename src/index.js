/**
 * LodeRuntime™ and Lode Architecture™
 * Copyright © 2025 Demiris Brown. All Rights Reserved.
 * (full header — contact Founder@simpletontechnologies.com)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.lode.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);
