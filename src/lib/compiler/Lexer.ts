import Token, { TokenMatch } from "../lexer/Token";
import { CompilationError } from "./errors";
import {
  CompilerProject,
  LexerResult,
  TokenResolverConfig,
  TokenResolverRuleResult,
} from "./types";

const lexFile = (
  filename: string,
  source: string,
  tokenResolverConfig: TokenResolverConfig
): Array<Token> => {
  let { tokenResolver, newLineToken } = tokenResolverConfig;
  let tokens = [];
  let currentPos = 0;
  let line = 1;
  let currentStream = source;

  while (currentStream.length > 0) {
    let match = { match: false } as TokenResolverRuleResult;
    for (let tr of tokenResolver) {
      match = tr.isMatch(currentStream);
      if (match.match) {
        break;
      }
      match = { match: false } as TokenResolverRuleResult;
    }
    if (!match.match) {
      throw new CompilationError(
        `Unexpected token ${currentStream.substring(0, 1)}`,
        line,
        currentPos,
        filename
      );
    }
    currentPos += match.position;
    if (match.token.value === newLineToken.value) {
      line++;
      currentPos = 0;
    }
    tokens.push(
      new Token(
        new TokenMatch(
          match.token.value,
          match.token.name,
          match.token.stripped
        ),
        match.text,
        line,
        currentPos,
        filename
      )
    );
    if (match.position === 0) break;
    currentStream = currentStream.substring(match.position);
  }
  return tokens;
};

export const lexer = {
  lex: (
    project: CompilerProject,
    tokenResolverConfig: TokenResolverConfig
  ): Array<LexerResult> => {
    const tokens = [];

    if (project.lib && project.lib.length > 0) {
      project.lib.forEach((l) => {
        tokens.push({
          name: l.name,
          tokens: lexFile(l.name, l.source, tokenResolverConfig).filter(
            (t) => !t.token.stripped
          ),
        });
      });
    }

    project.files.forEach((f, i) => {
      if (i == 0) return;
      console.log(f.name);
      tokens.push({
        name: f.name.replace(".bas", "").toLowerCase(),
        tokens: lexFile(f.name, f.source, tokenResolverConfig).filter(
          (t) => !t.token.stripped
        ),
      });
    });

    const main = lexFile(
      project.files[0].name,
      project.files[0].source,
      tokenResolverConfig
    );

    if (main && main.length > 0) {
      tokens.push({
        name: "main",
        tokens: main.filter((t) => !t.token.stripped),
      });
    }

    return tokens;
  },
};

export default lexer;
