"use strict";
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
var rpcFindMatch = function (ctx, logger, nk, payload) {
    if (!ctx.userId) {
        throw Error('No user ID in context');
    }
    if (!payload) {
        throw Error('Expects payload.');
    }
    var request = {};
    try {
        request = JSON.parse(payload);
    }
    catch (error) {
        logger.error('Error parsing json message: %q', error);
        throw error;
    }
    var matches;
    try {
        var query = "+label.open:1 +label.fast:".concat(request.fast ? 1 : 0);
        matches = nk.matchList(10, true, null, null, 1, query);
    }
    catch (error) {
        logger.error('Error listing matches: %v', error);
        throw error;
    }
    var matchIds = [];
    if (matches.length > 0) {
        // There are one or more ongoing matches the user could join.
        matchIds = matches.map(function (m) { return m.matchId; });
    }
    else {
        // // No available matches found, create a new one.
        // try {
        //     matchIds.push(nk.matchCreate(moduleName, {fast: request.fast, matchName: request.matchName}));
        // } catch (error) {
        //     logger.error('Error creating match: %v', error);
        //     throw error;
        // }
        // logger.info("match name =======> %v", ctx.matchLabel)
    }
    var res = { matches: matches };
    return JSON.stringify(res);
};
var rpcCreateMatch = function (ctx, logger, nk, payload) {
    if (!ctx.userId) {
        throw Error('No user ID in context');
    }
    if (!payload) {
        throw Error('Expects payload.');
    }
    logger.info("payload =======> %v", payload);
    var request = {};
    try {
        request = JSON.parse(payload);
    }
    catch (error) {
        logger.error('Error parsing json message: %q', error);
        throw error;
    }
    var matchName = request.matchName;
    var matchIds = [];
    // No available matches found, create a new one.
    try {
        logger.info("userId %v:   ", ctx.userId);
        matchIds.push(nk.matchCreate(moduleName, { matchName: "Room", userId: ctx.userId }));
        logger.info("MacthIds:  %s", matchIds);
    }
    catch (error) {
        logger.error('Error creating match: %v', error);
        throw error;
    }
    var res = { matchIds: matchIds, matchName: matchName };
    return JSON.stringify(res);
};
var rpcGetMatch = function (ctx, logger, nk, payload) {
    if (!ctx.userId) {
        throw Error('No user ID in context');
    }
    if (!payload) {
        throw Error('Expects payload.');
    }
    logger.info("payload =======> %v", payload);
    var request = {};
    try {
        request = JSON.parse(payload);
    }
    catch (error) {
        logger.error('Error parsing json message: %q', error);
        throw error;
    }
    var matchIds = [];
    // No available matches found, create a new one.
    try {
        matchIds.push(JSON.stringify(nk.matchGet(request.matchId)));
        logger.info("MacthIds:  %s", matchIds);
    }
    catch (error) {
        logger.error('Error creating match: %v', error);
        throw error;
    }
    // Query for all available matches
    var matches = nk.matchList(10, true);
    // Extract the match labels from the match data
    var matchLabels = matches.map(function (match) { return match.label; });
    // Return the list of match labels
    logger.info("matches ============> %v", JSON.stringify(matchLabels));
    var res = { matchIds: matchIds };
    return JSON.stringify(res);
};
var rpcNotify = function (ctx, logger, nk, payload) {
    if (!ctx.userId) {
        throw Error('No user ID in context');
    }
    if (!payload) {
        throw Error('Expects payload.');
    }
    logger.info("payload =======> %v", payload);
    var request = {
        ownerId: '',
        matchId: '',
        playerId: '',
        playerName: ''
    };
    try {
        request = JSON.parse(payload);
    }
    catch (error) {
        logger.error('Error parsing json message: %q', error);
        throw error;
    }
    nk.notificationSend(request.ownerId, 'Player wants to join match', request, 1, null, true);
};
var rpcGetUser = function (context, logger, nk, payload) {
    // Get a connection from the Nakama pool to execute the query.
    var rows = [];
    rows = nk.sqlQuery("SELECT ID FROM USERS WHERE STATUS = 'online' LIMIT 1");
    // for(let i = 0; i < rows.length; i++) {
    //
    // }
    // Return the online accounts data as the result of the RPC function.
    logger.info("payload =======> %v", payload);
    var request = {
        ownerId: '',
        matchId: '',
        playerId: ''
    };
    try {
        request = JSON.parse(payload);
    }
    catch (error) {
        logger.error('Error parsing json message: %q', error);
        throw error;
    }
    logger.info("rows =======> %v", rows);
    logger.info("user =======> %v", rows[0]['id']);
    request.playerId = rows[0]['id'];
    nk.notificationSend(request.playerId, 'Invite to match', request, 1, null, true);
};
var afterAuthenticateDevice = function (ctx, logger, nk, data, request) {
    // Change status after logging in
    nk.sqlQuery("UPDATE USERS SET STATUS = 'online' WHERE ID = $1", [ctx.userId]);
};
var beforeMatchmakerAdd = function (ctx, logger, nk, envelope) {
    // Force the count multiple to be in multiples of 5
    var e = envelope;
    e.matchmakerAdd.countMultiple = 5;
    return envelope;
};
var onMatchmakerMatched = function (ctx, logger, nk, matches) {
    logger.info("Match is Made");
    matches.forEach(function (match) {
        logger.info("Matched user '%s' named '%s'", match.presence.userId, match.presence.username);
        Object.keys(match.properties).forEach(function (key) {
            logger.info("Matched on '%s' value '%v'", key, match.properties[key]);
        });
    });
    var matchId = nk.matchCreate("lobby", { "invited": matches });
    logger.debug(matchId);
    return matchId;
};
///<reference path="match_rpc.ts"/>
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
var rpcIdRewards = 'rewards_js';
var rpcIdFindMatch = 'find_match_js';
var rpcIdCreateMatch = 'create_match_js';
var rpcIdGetMatch = 'get_match_js';
var rpcIdNotify = 'notify_js';
function InitModule(ctx, logger, nk, initializer) {
    initializer.registerRpc(rpcIdRewards, rpcReward);
    initializer.registerRpc(rpcIdCreateMatch, rpcCreateMatch);
    initializer.registerRpc(rpcIdFindMatch, rpcFindMatch);
    initializer.registerRpc(rpcIdGetMatch, rpcGetMatch);
    initializer.registerRpc(rpcIdNotify, rpcNotify);
    // initializer.registerRtBefore("MatchmakerAdd", beforeMatchmakerAdd)
    // initializer.registerMatchmakerMatched(onMatchmakerMatched);
    // initializer.registerAfterAuthenticateDevice(afterAuthenticateDevice);
    initializer.registerMatch(moduleName, {
        matchInit: matchInit,
        matchJoinAttempt: matchJoinAttempt,
        matchJoin: matchJoin,
        matchLeave: matchLeave,
        matchLoop: matchLoop,
        matchTerminate: matchTerminate,
        matchSignal: matchSignal,
    });
    logger.info('JavaScript logic loaded.');
}
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
function rpcReward(context, logger, nk, payload) {
    if (!context.userId) {
        throw Error('No user ID in context');
    }
    if (payload) {
        throw Error('no input allowed');
    }
    var objectId = {
        collection: 'reward',
        key: 'daily',
        userId: context.userId,
    };
    var objects;
    try {
        objects = nk.storageRead([objectId]);
    }
    catch (error) {
        logger.error('storageRead error: %s', error);
        throw error;
    }
    var dailyReward = {
        lastClaimUnix: 0,
    };
    objects.forEach(function (object) {
        if (object.key == 'daily') {
            dailyReward = object.value;
        }
    });
    var resp = {
        coinsReceived: 0,
    };
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    // If last claimed is before the new day grant a new reward!
    // if (dailyReward.lastClaimUnix < msecToSec(d.getTime())) {
    //     resp.coinsReceived = 500;
    //
    //     // Update player wallet.
    //     var changeset = {
    //         coins: resp.coinsReceived,
    //     }
    //     try {
    //         nk.walletUpdate(context.userId, changeset, {}, false);
    //     } catch (error) {
    //         logger.error('walletUpdate error: %q', error);
    //         throw error;
    //     }
    //
    //     var notification: nkruntime.NotificationRequest = {
    //         code: 1001,
    //         content: changeset,
    //         persistent: true,
    //         subject: "You've received your daily reward!",
    //         userId: context.userId,
    //     }
    //     try {
    //         nk.notificationsSend([notification]);
    //     } catch (error) {
    //         logger.error('notificationsSend error: %q', error);
    //         throw error;
    //     }
    //
    //     dailyReward.lastClaimUnix = msecToSec(Date.now());
    //
    //     var write: nkruntime.StorageWriteRequest = {
    //         collection: 'reward',
    //         key: 'daily',
    //         permissionRead: 1,
    //         permissionWrite: 0,
    //         value: dailyReward,
    //         userId: context.userId,
    //     }
    //     if (objects.length > 0) {
    //         write.version = objects[0].version
    //     }
    //
    //     try {
    //         nk.storageWrite([ write ])
    //     } catch (error) {
    //         logger.error('storageWrite error: %q', error);
    //         throw error;
    //     }
    // }
    var result = JSON.stringify(resp);
    logger.debug('rpcReward resp: %q', result);
    return result;
}
function msecToSec(n) {
    return Math.floor(n / 1000);
}
var Mark;
(function (Mark) {
    Mark[Mark["X"] = 1] = "X";
    Mark[Mark["O"] = 2] = "O";
    Mark[Mark["UNDEFINED"] = 0] = "UNDEFINED";
})(Mark || (Mark = {}));
// The complete set of opcodes used for communication between clients and server.
var OpCode;
(function (OpCode) {
    // New game round starting.
    OpCode[OpCode["START"] = 1] = "START";
    // Update to the state of an ongoing round.
    OpCode[OpCode["UPDATE"] = 2] = "UPDATE";
    // A game round has just completed.
    OpCode[OpCode["DONE"] = 3] = "DONE";
    // A move the player wishes to make and sends to the server.
    OpCode[OpCode["MOVE"] = 4] = "MOVE";
    // Move was rejected.
    OpCode[OpCode["REJECTED"] = 5] = "REJECTED";
})(OpCode || (OpCode = {}));
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
var moduleName = "tic-tac-toe_js";
var tickRate = 5;
var maxEmptySec = 30;
var delaybetweenGamesSec = 5;
var turnTimeFastSec = 10;
var turnTimeNormalSec = 20;
var winningPositions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];
var matchInit = function (ctx, logger, nk, params) {
    var fast = !!params['fast'];
    var label = {
        open: 1,
        fast: 0,
        matchName: '',
        accept: true,
        userId: ''
    };
    if (fast) {
        label.fast = 1;
    }
    var state = {
        playerId: '',
        matchId: '',
        accept: true,
        userId: params.userId,
        matchName: params.matchName,
        password: params.password,
        label: label,
        emptyTicks: 0,
        presences: {},
        joinsInProgress: 0,
        playing: false,
        board: [],
        marks: {},
        mark: Mark.UNDEFINED,
        deadlineRemainingTicks: 0,
        winner: null,
        winnerPositions: null,
        nextGameRemainingTicks: 0,
    };
    logger.info("`state ========> `%v", state);
    label.userId = params.userId;
    label.matchName = state.matchName;
    return {
        state: state,
        tickRate: tickRate,
        label: JSON.stringify(label),
    };
};
var matchJoinAttempt = function (ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
    logger.info("metadata =====> %v", metadata);
    logger.info("metadata matchId =====> %v", metadata['matchId']);
    state.matchId = metadata['matchId'];
    state.playerId = metadata['playerId'];
    state.userId = presence.userId;
    // Check if it's a user attempting to rejoin after a disconnect.
    if (presence.userId in state.presences) {
        if (state.presences[presence.userId] === null) {
            // User rejoining after a disconnect.
            state.joinsInProgress++;
            return {
                state: state,
                accept: false,
            };
        }
        else {
            // User attempting to join from 2 different devices at the same time.
            return {
                state: state,
                accept: false,
                rejectMessage: 'already joined',
            };
        }
    }
    // if(ctx.userId === metadata.userId) {
    //     nk.notificationSend("", "Invite", {accept: true}, 1, null, true)
    // }
    // Check if match is full.
    if (connectedPlayers(state) + state.joinsInProgress >= 2) {
        return {
            state: state,
            accept: false,
            rejectMessage: 'match full',
        };
    }
    // New player attempting to connect.
    state.joinsInProgress++;
    return {
        state: state,
        accept: true,
    };
};
var matchJoin = function (ctx, logger, nk, dispatcher, tick, state, presences) {
    var t = msecToSec(Date.now());
    logger.info("join Match -----------------------------------");
    nk.sqlQuery("UPDATE USERS SET STATUS = 'in match' WHERE ID = $1", [state.userId]);
    logger.info("state.presences ---------> %v", state.presences);
    logger.info("state.presences ---------> %v", JSON.stringify(state.presences));
    if (JSON.stringify(state.presences) === "{}") {
        var payload = {
            matchId: state.matchId,
            ownerId: state.userId,
            playerId: ''
        };
        rpcGetUser(ctx, logger, nk, JSON.stringify(payload));
    }
    for (var _i = 0, presences_1 = presences; _i < presences_1.length; _i++) {
        var presence = presences_1[_i];
        state.emptyTicks = 0;
        state.presences[presence.userId] = presence;
        state.joinsInProgress--;
        // Check if we must send a message to this user to update them on the current game state.
        if (state.playing) {
            // There's a game still currently in progress, the player is re-joining after a disconnect. Give them a state update.
            var update = {
                board: state.board,
                mark: state.mark,
                deadline: t + Math.floor(state.deadlineRemainingTicks / tickRate),
            };
            // Send a message to the user that just joined.
            dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify(update));
        }
        else if (state.board.length !== 0 && Object.keys(state.marks).length !== 0 && state.marks[presence.userId]) {
            logger.debug('player %s rejoined game', presence.userId);
            // There's no game in progress but we still have a completed game that the user was part of.
            // They likely disconnected before the game ended, and have since forfeited because they took too long to return.
            var done = {
                board: state.board,
                winner: state.winner,
                winnerPositions: state.winnerPositions,
                nextGameStart: t + Math.floor(state.nextGameRemainingTicks / tickRate)
            };
            // Send a message to the user that just joined.
            dispatcher.broadcastMessage(OpCode.DONE, JSON.stringify(done));
        }
    }
    // Check if match was open to new players, but should now be closed.
    if (Object.keys(state.presences).length
        >= 2 && state.label.open != 0) {
        state.label.open = 0;
        var labelJSON = JSON.stringify(state.label);
        dispatcher.matchLabelUpdate(labelJSON);
    }
    return { state: state };
};
var matchLeave = function (ctx, logger, nk, dispatcher, tick, state, presences) {
    for (var _i = 0, presences_2 = presences; _i < presences_2.length; _i++) {
        var presence = presences_2[_i];
        logger.info("Player: %s left match: %s.", presence.userId, ctx.matchId);
        state.presences[presence.userId] = null;
    }
    return { state: state };
};
var matchLoop = function (ctx, logger, nk, dispatcher, tick, state, messages) {
    var _a;
    if (connectedPlayers(state) + state.joinsInProgress === 0) {
        state.emptyTicks++;
        if (state.emptyTicks >= maxEmptySec * tickRate) {
            // Match has been empty for too long, close it.
            logger.info('closing idle match');
            return null;
        }
    }
    var t = msecToSec(Date.now());
    // If there's no game in progress check if we can (and should) start one!
    if (!state.playing) {
        // Between games any disconnected users are purged, there's no in-progress game for them to return to anyway.
        for (var userID in state.presences) {
            if (state.presences[userID] === null) {
                delete state.presences[userID];
            }
        }
        // Check if we need to update the label so the match now advertises itself as open to join.
        if (Object.keys(state.presences).length < 2 && state.label.open != 1) {
            state.label.open = 1;
            var labelJSON = JSON.stringify(state.label);
            dispatcher.matchLabelUpdate(labelJSON);
        }
        // Check if we have enough players to start a game.
        if (Object.keys(state.presences).length < 2) {
            return { state: state };
        }
        // Check if enough time has passed since the last game.
        if (state.nextGameRemainingTicks > 0) {
            state.nextGameRemainingTicks--;
            return { state: state };
        }
        // We can start a game! Set up the game state and assign the marks to each player.
        state.playing = true;
        state.board = new Array(9);
        state.marks = {};
        var marks_1 = [Mark.X, Mark.O];
        Object.keys(state.presences).forEach(function (userId) {
            var _a;
            state.marks[userId] = (_a = marks_1.shift()) !== null && _a !== void 0 ? _a : null;
        });
        state.mark = Mark.X;
        state.winner = null;
        state.winnerPositions = null;
        state.deadlineRemainingTicks = calculateDeadlineTicks(state.label);
        state.nextGameRemainingTicks = 0;
        // Notify the players a new game has started.
        var msg = {
            board: state.board,
            marks: state.marks,
            mark: state.mark,
            deadline: t + Math.floor(state.deadlineRemainingTicks / tickRate),
        };
        logger.info("send msg: %s", msg);
        dispatcher.broadcastMessage(OpCode.START, JSON.stringify(msg), null, null, true);
        return { state: state };
    }
    // There's a game in progresstate. Check for input, update match state, and send messages to clientstate.
    for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
        var message = messages_1[_i];
        switch (message.opCode) {
            case OpCode.MOVE:
                logger.debug('Received move message from user: %v', state.marks);
                var mark = (_a = state.marks[message.sender.userId]) !== null && _a !== void 0 ? _a : null;
                if (mark === null || state.mark != mark) {
                    // It is not this player's turn.
                    dispatcher.broadcastMessage(OpCode.REJECTED, null, [message.sender]);
                    continue;
                }
                var msg = {};
                try {
                    msg = JSON.parse(nk.binaryToString(message.data));
                }
                catch (error) {
                    // Client sent bad data.
                    dispatcher.broadcastMessage(OpCode.REJECTED, null, [message.sender]);
                    logger.debug('Bad data received: %v', error);
                    continue;
                }
                if (state.board[msg.position]) {
                    // Client sent a position outside the board, or one that has already been played.
                    dispatcher.broadcastMessage(OpCode.REJECTED, null, [message.sender]);
                    continue;
                }
                // Update the game state.
                state.board[msg.position] = mark;
                state.mark = mark === Mark.O ? Mark.X : Mark.O;
                state.deadlineRemainingTicks = calculateDeadlineTicks(state.label);
                // Check if game is over through a winning move.
                var _b = winCheck(state.board, mark), winner = _b[0], winningPos = _b[1];
                if (winner) {
                    state.winner = mark;
                    state.winnerPositions = winningPos;
                    state.playing = false;
                    state.deadlineRemainingTicks = 0;
                    state.nextGameRemainingTicks = delaybetweenGamesSec * tickRate;
                }
                // Check if game is over because no more moves are possible.
                var tie = state.board.every(function (v) { return v !== null; });
                if (tie) {
                    // Update state to reflect the tie, and schedule the next game.
                    state.playing = false;
                    state.deadlineRemainingTicks = 0;
                    state.nextGameRemainingTicks = delaybetweenGamesSec * tickRate;
                }
                var opCode = void 0;
                var outgoingMsg = void 0;
                if (state.playing) {
                    opCode = OpCode.UPDATE;
                    var msg_1 = {
                        board: state.board,
                        mark: state.mark,
                        deadline: t + Math.floor(state.deadlineRemainingTicks / tickRate),
                    };
                    outgoingMsg = msg_1;
                }
                else {
                    opCode = OpCode.DONE;
                    var msg_2 = {
                        board: state.board,
                        winner: state.winner,
                        winnerPositions: state.winnerPositions,
                        nextGameStart: t + Math.floor(state.nextGameRemainingTicks / tickRate),
                    };
                    outgoingMsg = msg_2;
                }
                dispatcher.broadcastMessage(opCode, JSON.stringify(outgoingMsg));
                break;
            default:
                // No other opcodes are expected from the client, so automatically treat it as an error.
                dispatcher.broadcastMessage(OpCode.REJECTED, null, [message.sender]);
                logger.error('Unexpected opcode received: %d', message.opCode);
        }
    }
    // Keep track of the time remaining for the player to submit their move. Idle players forfeit.
    if (state.playing) {
        state.deadlineRemainingTicks--;
        if (state.deadlineRemainingTicks <= 0) {
            // The player has run out of time to submit their move.
            state.playing = false;
            state.winner = state.mark === Mark.O ? Mark.X : Mark.O;
            state.deadlineRemainingTicks = 0;
            state.nextGameRemainingTicks = delaybetweenGamesSec * tickRate;
            var msg = {
                board: state.board,
                winner: state.winner,
                nextGameStart: t + Math.floor(state.nextGameRemainingTicks / tickRate),
                winnerPositions: null,
            };
            dispatcher.broadcastMessage(OpCode.DONE, JSON.stringify(msg));
        }
    }
    return { state: state };
};
var matchTerminate = function (ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
    return { state: state };
};
var matchSignal = function (ctx, logger, nk, dispatcher, tick, state) {
    return { state: state };
};
function calculateDeadlineTicks(l) {
    if (l.fast === 1) {
        return turnTimeFastSec * tickRate;
    }
    else {
        return turnTimeNormalSec * tickRate;
    }
}
function winCheck(board, mark) {
    for (var _i = 0, winningPositions_1 = winningPositions; _i < winningPositions_1.length; _i++) {
        var wp = winningPositions_1[_i];
        if (board[wp[0]] === mark &&
            board[wp[1]] === mark &&
            board[wp[2]] === mark) {
            return [true, wp];
        }
    }
    return [false, null];
}
function connectedPlayers(s) {
    var count = 0;
    for (var _i = 0, _a = Object.keys(s.presences); _i < _a.length; _i++) {
        var p = _a[_i];
        if (s.presences[p] !== null) {
            count++;
        }
    }
    return count;
}
