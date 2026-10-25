# Image d'exécution, construite sur le serveur à partir du paquet de livraison (deploy/package.sh).
# Les dépendances de production sont déjà installées par la CI : pas d'accès à npm nécessaire.
FROM node:24-slim

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATA_DIR=/data

WORKDIR /app
COPY . .

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "const b=(process.env.BASE_PATH||'/').replace(/\/?$/,'/');fetch('http://127.0.0.1:'+process.env.PORT+b+'api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/server/dist/index.js"]
