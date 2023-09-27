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

const rpcIdRewards = 'rewards_js';
const rpcIdFindMatch = 'find_match_js';
const rpcIdCreateMatch = 'create_match_js';
const rpcIdGetMatch = 'get_match_js';
const rpcIdNotify = 'notify_js';
function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
    initializer.registerRpc(rpcIdRewards, rpcReward);
    initializer.registerRpc(rpcIdCreateMatch, rpcCreateMatch);
    initializer.registerRpc(rpcIdFindMatch, rpcFindMatch);
    initializer.registerRpc(rpcIdGetMatch, rpcGetMatch);
    initializer.registerRpc(rpcIdNotify, rpcNotify);

    // initializer.registerRtBefore("MatchmakerAdd", beforeMatchmakerAdd)
    // initializer.registerMatchmakerMatched(onMatchmakerMatched);
    // initializer.registerAfterAuthenticateDevice(afterAuthenticateDevice);
    initializer.registerMatch(moduleName, {
        matchInit,
        matchJoinAttempt,
        matchJoin,
        matchLeave,
        matchLoop,
        matchTerminate,
        matchSignal,
    });

    logger.info('JavaScript logic loaded.');
}
