import { authService, userService } from "../Source/Data Objects/DTO.js";
import type { RegisterDTO } from "../Source/Modules/Identity/Authentication/authentication.types.js";
import { ErrorMsg, Info } from "../Source/Utilities/Logger.js";

const AdminCredentials: RegisterDTO = {
  name: "Admin Properties",
  email: "admin@ferracorp.com",
  password: "PropertiesProposal",
  phone: "0710995354",
};

(async () => {
  try {
    const AdminUser = await authService.register(AdminCredentials, {
      ipAddress: "0.0.0.0",
      userAgent: "Universal",
    });

    await userService.editUser(AdminUser.user.id, {
      role: "admin",
    });

    Info("Seed generation successful");
    process.exit(0);
  } catch (error) {
    ErrorMsg(error as Error);
    process.exit(1);
  }
})();
