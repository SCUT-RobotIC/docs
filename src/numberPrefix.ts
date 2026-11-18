export default function parseHierarchicalNumberPrefix(filename: string) {
  const match = filename.match(/^(\d+(?:\.\d+)?)(?:\s*[._-]\s*)(.+)$/);
  if (!match) {
    return {filename, numberPrefix: undefined};
  }

  const [majorText, minorText = "0"] = match[1].split(".");
  const major = Number(majorText);
  const minor = Number(minorText);

  return {
    filename: match[2],
    numberPrefix: major + minor / 1000,
  };
}
