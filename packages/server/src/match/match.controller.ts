import { Player, Response$GetMatches } from '@/typings';
import {
  Controller,
  Post,
  Body,
  Inject,
  NotFoundException,
  Get,
  Param,
  Query,
  ForbiddenException
} from '@nestjs/common';
import { Game, Server } from 'boardgame.io';
import { InitializeGame } from 'boardgame.io/internal';
import { nanoid } from 'nanoid';
import { MatchService } from './match.service';
import {
  CreateMatchDto,
  JoinMatchDto,
  LeaveMatchDto,
  PlayAgainDto,
  GetMatchesDto
} from './dto';
import {
  SetupData,
  Response$GetMatch,
  Response$CreateMatch,
  Response$JoinMatch,
  Response$PlayAgain
} from '@/typings';

@Controller('match')
export class MatchController {
  gameMap: Record<string, Game>;

  constructor(
    private readonly matchService: MatchService,
    @Inject('GAMES') private games: Game[]
  ) {
    this.gameMap = this.games.reduce(
      (result, game) => ({ ...result, [game.name]: game }),
      {} as Record<string, Game>
    );
  }

  /**
   * Create a metadata object without secret credentials to return to the client.
   *
   * @param {string} matchID - The identifier of the match the metadata belongs to.
   * @param {object} metadata - The match metadata object to strip credentials from.
   * @return - A metadata object without player credentials.
   */
  createClientMatchData = (
    matchID: string,
    metadata: Server.MatchData
  ): Response$GetMatch => {
    if (metadata.setupData) {
      return {
        ...metadata,
        matchID,
        unlisted: !!metadata.unlisted,
        setupData: metadata.setupData as SetupData,
        players: Object.values(metadata.players).map(player => {
          // strip away credentials
          const { credentials, ...strippedInfo } = player;
          return strippedInfo;
        })
      };
    }
    throw new Error('qweqwe');
  };

  @Get('/:name')
  async getMatches(@Query() dto: GetMatchesDto): Promise<Response$GetMatches> {
    const metatadas = await this.matchService.getMatches(dto);
    return {
      matches: metatadas.map(meta =>
        this.createClientMatchData(meta.matchID, meta)
      )
    };
  }

  @Get('/:name/:matchID')
  async getMatch(
    @Param('matchID') matchID: string
  ): Promise<Response$GetMatch> {
    const { metadata } = await this.matchService.fetch(matchID, {
      metadata: true
    });
    return this.createClientMatchData(matchID, metadata);
  }

  @Post('create')
  async createMatch(
    @Body() dto: CreateMatchDto
  ): Promise<Response$CreateMatch> {
    const game = this.gameMap[dto.name];

    if (game) {
      const { numPlayers, setupData, unlisted } = dto;
      const players = Array.from<null>({ length: numPlayers }).reduce(
        (players, _, idx) => ({ ...players, [idx]: { id: idx } }),
        {} as Record<number, Player>
      );
      const metadata: Server.MatchData = {
        players,
        gameName: game.name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        unlisted: !!unlisted,
        setupData
      };
      const matchID = nanoid();
      const initialState = InitializeGame({ game, numPlayers, setupData });

      await this.matchService.createGame(matchID, { metadata, initialState });

      return { matchID };
    }

    throw new NotFoundException('Game not found');
  }

  @Post('join')
  async joinMatch(@Body() dto: JoinMatchDto): Promise<Response$JoinMatch> {
    const { matchID, playerID, playerName } = dto;
    const match = await this.matchService.fetch(dto.matchID, {
      metadata: true
    });

    const metadata = { ...match.metadata };
    metadata.players[playerID].name = playerName;

    await this.matchService.setMetadata(matchID, metadata);

    const playerCredentials = nanoid();

    return { playerCredentials };
  }

  @Post('leave')
  async leaveMatch(@Body() dto: LeaveMatchDto): Promise<void> {
    const { matchID, playerID, credentials } = dto;
    const { metadata } = await this.matchService.fetch(dto.matchID, {
      metadata: true
    });

    if (credentials !== metadata.players[playerID].credentials) {
      throw new ForbiddenException('Invalid credentials ' + credentials);
    }

    delete metadata.players[playerID].name;
    delete metadata.players[playerID].credentials;
    if (Object.values(metadata.players).some(player => player.name)) {
      await this.matchService.setMetadata(matchID, metadata);
    } else {
      await this.matchService.wipe(matchID);
    }
  }

  @Post('playAgain')
  async playAgain(@Body() dto: PlayAgainDto): Promise<Response$PlayAgain> {
    const { matchID, playerID, credentials, name } = dto;
    const { metadata } = await this.matchService.fetch(matchID, {
      metadata: true
    });

    if (credentials !== metadata.players[playerID].credentials) {
      throw new ForbiddenException('Invalid credentials ' + credentials);
    }

    if (metadata.nextMatchID) {
      return { nextMatchID: metadata.nextMatchID };
    }

    const numPlayers = Object.keys(metadata.players).length;

    const { matchID: nextMatchID } = await this.createMatch({
      ...metadata,
      name,
      numPlayers,
      setupData: metadata.setupData as SetupData
    });

    metadata.nextMatchID = nextMatchID;

    await this.matchService.setMetadata(matchID, metadata);

    return { nextMatchID };
  }
}