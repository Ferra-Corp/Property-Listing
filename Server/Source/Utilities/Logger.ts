import chalk from "chalk";

const date = new Date();

export const Info = (message: string) => {
    process.stdout.write(
      `${chalk.blueBright.underline(`Info[${date.toString()}]`)}: ${chalk.whiteBright(message)}\n`,
    );
  },
  Warning = (message: string) => {
    process.stdout.write(
      `${chalk.yellowBright.underline(`Warning[${date.toString()}]`)}: ${chalk.whiteBright(message)}\n`,
    );
  },
  ErrorMsg = (error: Error) => {
    process.stdout.write(
      `${chalk.redBright.underline(`Error[${date.toString()}]`)}: ${error.message}\n`,
    );
  };
