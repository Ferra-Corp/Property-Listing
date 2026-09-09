import { Resend } from "resend";
import { RESEND_KEY } from "../../Configurations/Env.js";

let resend: Resend | undefined;

const getResendClient = (): Resend => {
  if (!RESEND_KEY)
    throw new Error("RESEND_KEY must be provided in .env to send mail");

  resend ??= new Resend(RESEND_KEY);

  return resend;
};

export const PasswordResetMail = async (email: string, url: string) => {
  try {
    const resetEmail = await getResendClient().emails.send({
      from: "security@ferracorp.com",
      to: email,
      template: {
        id: "ae67403d-92c2-4c65-9630-43526ab0a8bf",
        variables: {
          email,
          link: url,
        },
      },
    });

    if (resetEmail.error) throw new Error(resetEmail.error.message);
  } catch (error) {
    throw error;
  }
};

export const InviteAgent = async (email: string, url: string) => {
  try {
    const invite = await getResendClient().emails.send({
      from: "security@ferracorp.com",
      to: email,
      template: {
        id: "b3f3ad06-03bd-4052-9978-10321a7943be",
        variables: {
          email,
          link: url,
        },
      },
    });

    if (invite.error) throw new Error(invite.error.message);
  } catch (error) {
    throw error;
  }
};
