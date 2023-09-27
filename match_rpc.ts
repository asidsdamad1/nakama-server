// Copyright 2020 The Nakama Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
let rpcFindMatch: nkruntime.RpcFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    if (!ctx.userId) {
        throw Error('No user ID in context');
    }

    if (!payload) {
        throw Error('Expects payload.');
    }

    let request = {} as RpcFindMatchRequest;
    try {
        request = JSON.parse(payload);
    } catch (error) {
        logger.error('Error parsing json message: %q', error);
        throw error;
    }

    let matches: nkruntime.Match[];
    try {
        const query = `+label.open:1 +label.fast:${request.fast ? 1 : 0}`;
        matches = nk.matchList(10, true, null, null, 1, query);
    } catch (error) {
        logger.error('Error listing matches: %v', error);
        throw error;
    }


    let matchIds: string[] = [];
    if (matches.length > 0) {
        // There are one or more ongoing matches the user could join.
        matchIds = matches.map(m => m.matchId);
    } else {
        // // No available matches found, create a new one.
        // try {
        //     matchIds.push(nk.matchCreate(moduleName, {fast: request.fast, matchName: request.matchName}));
        // } catch (error) {
        //     logger.error('Error creating match: %v', error);
        //     throw error;
        // }
        // logger.info("match name =======> %v", ctx.matchLabel)
    }

    let res: { matches: nkruntime.Match[] } = {matches};
    return JSON.stringify(res);
}

let rpcCreateMatch = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    if (!ctx.userId) {
        throw Error('No user ID in context');
    }

    if (!payload) {
        throw Error('Expects payload.');
    }

    logger.info("payload =======> %v", payload)
    let request = {} as RpcFindMatchRequest;
    try {
        request = JSON.parse(payload);
    } catch (error) {
        logger.error('Error parsing json message: %q', error);
        throw error;
    }


    let matchName = request.matchName
    let matchIds: string[] = [];
    // No available matches found, create a new one.
    try {
        logger.info("userId %v:   ", ctx.userId)
        matchIds.push(nk.matchCreate(moduleName, {matchName: "Room", userId: ctx.userId}));
        logger.info("MacthIds:  %s", matchIds);
    } catch (error) {
        logger.error('Error creating match: %v', error);
        throw error;
    }


    let res: RpcFindMatchResponse = {matchIds, matchName};
    return JSON.stringify(res);
}

let rpcGetMatch = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    if (!ctx.userId) {
        throw Error('No user ID in context');
    }

    if (!payload) {
        throw Error('Expects payload.');
    }
    logger.info("payload =======> %v", payload)
    let request = {} as RpcFindMatchRequest;
    try {
        request = JSON.parse(payload);
    } catch (error) {
        logger.error('Error parsing json message: %q', error);
        throw error;
    }

    let matchIds: string[] = [];
    // No available matches found, create a new one.
    try {

        matchIds.push(JSON.stringify(nk.matchGet(request.matchId)));
        logger.info("MacthIds:  %s", matchIds);
    } catch (error) {
        logger.error('Error creating match: %v', error);
        throw error;
    }

// Query for all available matches
    const matches = nk.matchList(10, true);

    // Extract the match labels from the match data
    const matchLabels = matches.map(match => match.label);

    // Return the list of match labels
    logger.info("matches ============> %v", JSON.stringify(matchLabels));

    let res: { matchIds: string[] } = {matchIds};
    return JSON.stringify(res);
}

let rpcNotify = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): void {
    if (!ctx.userId) {
        throw Error('No user ID in context');
    }

    if (!payload) {
        throw Error('Expects payload.');
    }

    logger.info("payload =======> %v", payload)
    let request = {
        ownerId: '',
        matchId: '',
        playerId: '',
        playerName: ''
    };
    try {
        request = JSON.parse(payload);
    } catch (error) {
        logger.error('Error parsing json message: %q', error);
        throw error;
    }

    nk.notificationSend(request.ownerId, 'Player wants to join match', request, 1, null, true)
}

let rpcGetUser = function (context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): void {

    // Get a connection from the Nakama pool to execute the query.
    let rows: nkruntime.SqlQueryResult = [];
    rows = nk.sqlQuery("SELECT ID FROM USERS WHERE STATUS = 'online' LIMIT 1");

    // for(let i = 0; i < rows.length; i++) {
    //
    // }


    // Return the online accounts data as the result of the RPC function.


    logger.info("payload =======> %v", payload)
    let request = {
        ownerId: '',
        matchId: '',
        playerId: ''
    };
    try {
        request = JSON.parse(payload);
    } catch (error) {
        logger.error('Error parsing json message: %q', error);
        throw error;
    }

    logger.info("rows =======> %v", rows)
    logger.info("user =======> %v", rows[0]['id'])

    request.playerId = rows[0]['id']


    nk.notificationSend(request.playerId, 'Invite to match', request, 1, null, true)
}

let afterAuthenticateDevice: nkruntime.AfterHookFunction<nkruntime.Session, nkruntime.AuthenticateDeviceRequest> = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, data: nkruntime.Session, request: nkruntime.AuthenticateDeviceRequest) {
    // Change status after logging in
    nk.sqlQuery("UPDATE USERS SET STATUS = 'online' WHERE ID = $1", [ctx.userId]);
};

const beforeMatchmakerAdd : nkruntime.RtBeforeHookFunction<nkruntime.Envelope> = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, envelope: nkruntime.Envelope) : nkruntime.Envelope | void {
    // Force the count multiple to be in multiples of 5
    const e = envelope as nkruntime.EnvelopeMatchmakerAdd
    e.matchmakerAdd.countMultiple = 5;

    return envelope;
}

const onMatchmakerMatched : nkruntime.MatchmakerMatchedFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, matches: nkruntime.MatchmakerResult[]): string | void {
    logger.info("Match is Made");

    matches.forEach(function (match) {
        logger.info("Matched user '%s' named '%s'", match.presence.userId, match.presence.username);

        Object.keys(match.properties).forEach(function (key) {
            logger.info("Matched on '%s' value '%v'", key, match.properties[key]);
        });
    });

    const matchId = nk.matchCreate("lobby", { "invited": matches })
    logger.debug(matchId);
    return matchId;
};
