import definePlugin from "@utils/types";
import { findByProps } from "@webpack";

export default definePlugin({
  name: "GodMode",
  description: "Overrides Discord permissions (for UI only) to always return true.",
  authors: [{ name: "Mr_PanoZzz", id: 939129546551210056n }],
  version: "1.3.1",

  start() {
    const PermissionStore = findByProps("canBasicChannel");
    const UserStore = findByProps("getUserStoreVersion");
    const Guilds = findByProps("getGuildCount")?.getGuilds?.();
    const Guild = Guilds ? Object.values(Guilds)[0] : null;

    if (!PermissionStore || !UserStore || !Guild) {
      console.error("[GodMode] Failed to find required modules.");
      return;
    }

    this._originalPerms = {};
    const override = () => true;
    const fields = [
      "can", "canAccessGuildSettings", "canAccessMemberSafetyPage", "canBasicChannel",
      "canImpersonateRole", "canManageUser", "canWithPartialContext", "isRoleHigher"
    ];

    for (const field of fields) {
      this._originalPerms[field] = PermissionStore[field];
      PermissionStore[field] = override;
    }

    this._originalIsOwner = {
      isOwner: Guild.isOwner,
      isOwnerWithRequiredMfaLevel: Guild.isOwnerWithRequiredMfaLevel
    };

    Guild.isOwner = function(id: string) {
      return [UserStore.getCurrentUser()?.id, this.ownerId].includes(id);
    };
    Guild.isOwnerWithRequiredMfaLevel = Guild.isOwner;
  },

  stop() {
    const PermissionStore = findByProps("canBasicChannel");
    const Guilds = findByProps("getGuildCount")?.getGuilds?.();
    const Guild = Guilds ? Object.values(Guilds)[0] : null;

    if (!PermissionStore || !Guild) return;

    for (const [field, original] of Object.entries(this._originalPerms || {})) {
      PermissionStore[field] = original;
    }

    if (this._originalIsOwner) {
      Guild.isOwner = this._originalIsOwner.isOwner;
      Guild.isOwnerWithRequiredMfaLevel = this._originalIsOwner.isOwnerWithRequiredMfaLevel;
    }
  },
});