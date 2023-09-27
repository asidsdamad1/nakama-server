#FROM node:16 AS builder
#
#WORKDIR /backend
##COPY package*.json .
#COPY . .
#
#RUN npm install
#COPY tsconfig.json .
#COPY *.ts .
#RUN npx tsc
#
#FROM heroiclabs/nakama:3.9.0
#
#COPY --from=builder /backend/build/*.js /nakama/data/modules/build/
#COPY --from=builder /backend/local.yml /nakama/data/


FROM heroiclabs/nakama-pluginbuilder:3.16.0 AS builder

ENV GO111MODULE on
ENV CGO_ENABLED 1
ENV GOPRIVATE "github.com/heroiclabs/nakama-project-template"

WORKDIR /backend
COPY . .

RUN go build --trimpath --mod=vendor --buildmode=plugin -o ./backend.so

FROM heroiclabs/nakama:3.16.0

COPY --from=builder /backend/backend.so /nakama/data/modules
COPY --from=builder /backend/build/*.js /nakama/data/modules/build/
COPY --from=builder /backend/local.yml /nakama/data/
