import chalk from "chalk";

const stamp = () => new Date().toString();

/**
 * `error.message` alone is often empty: a failed connect to `localhost` (Node
 * tries ::1 and 127.0.0.1) throws an AggregateError whose own message is "",
 * with the real reasons in `.errors`. Pull out whatever identifies the failure
 * so a log line is never just "Error: <blank>".
 */
const describe = (error: unknown): string => {
  if (!(error instanceof Error)) return String(error);

  const code = (error as NodeJS.ErrnoException).code,
    inner =
      error instanceof AggregateError
        ? error.errors.map((cause) => describe(cause)).join("; ")
        : "";

  return (
    [error.name, code, error.message, inner].filter(Boolean).join(" · ") ||
    "Unknown error"
  );
};

export const Info = (message: string) => {
    process.stdout.write(
      `${chalk.blueBright.underline(`Info[${stamp()}]`)}: ${chalk.whiteBright(message)}\n`,
    );
  },
  Warning = (message: string) => {
    process.stdout.write(
      `${chalk.yellowBright.underline(`Warning[${stamp()}]`)}: ${chalk.whiteBright(message)}\n`,
    );
  },
  ErrorMsg = (error: Error) => {
    process.stdout.write(
      `${chalk.redBright.underline(`Error[${stamp()}]`)}: ${describe(error)}\n`,
    );
  };
