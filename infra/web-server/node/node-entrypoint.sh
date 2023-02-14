#!/bin/sh

if [ ! -f ".env" ]; then
  cp .env.exemple .env
fi

npm install

npm run dev