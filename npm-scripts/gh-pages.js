import ghPages from "gh-pages";
import { execSync } from "child_process";

const gitRemoteCommand = "git config --get remote.origin.url";
const gitBranchNamesCommand = "git rev-parse --abbrev-ref HEAD";
const targetDirectory = "dist";

// GitのリモートURLを取得する関数
const getGitRemoteURL = () => {
  try {
    const output = execSync(gitRemoteCommand).toString().trim();
    return output;
  } catch (error) {
    console.error("Failed to get Git remote URL:", error.message);
    return null;
  }
};

// Gitのブランチ名を取得する関数
const getGitBranchName = () => {
  try {
    const output = execSync(gitBranchNamesCommand).toString().trim().split("/");
    const branchName = output[output.length - 1];
    return branchName === "main-wd" ? "main" : branchName;
  } catch (error) {
    console.error("Failed to get Git branch name:", error.message);
    return null;
  }
};

// SSHのアドレスをHTTPSのアドレスに変換する関数
const convertSSHtoHTTPS = (url) => {
  const regex = /^git@([^:/]+)[:/](.+)\.git$/;
  const matches = url.match(regex);
  if (!matches) {
    return url;
  }
  const host = matches[1];
  const repository = matches[2];

  // HTTPS URLの形式に変換
  const httpsUrl = `https://${host}/${repository}`;

  return httpsUrl;
};

// ドメインの先頭に「pages.」を追加する関数
const addPrefixToDomain = (url) => {
  const matches = url.match(/^(https?:\/\/)([^/]+)/);
  if (matches) {
    const protocol = matches[1];
    const domain = matches[2];
    const modifiedDomain = `pages.${domain}`;
    return protocol + modifiedDomain + url.substring(protocol.length + domain.length);
  }
  return url;
};

const main = async () => {
  const remoteURL = await getGitRemoteURL();
  const branchName = await getGitBranchName();
  const httpsURL = await convertSSHtoHTTPS(remoteURL);
  const previewDomain = await addPrefixToDomain(httpsURL);
  ghPages.publish(targetDirectory,
    {
      dest: `preview/${branchName}`,
      dotfiles: true,
    },
    () => {
      console.log("\n\x1b[36;1mgh-pages deploy done!\n");
      console.log(`${previewDomain}/preview/${branchName}\x1b[0m\n`);
    }
  );
};

main();
