FROM node:10

COPY nodeServer /home/mimic/nodeServer/
COPY config.js /home/mimic/nodeServer/

RUN cd /home/mimic/nodeServer \
    && npm install

CMD ["/home/mimic/nodeServer/runner.sh"]
