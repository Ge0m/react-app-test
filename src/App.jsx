import React, { useState, useEffect, useRef } from "react";
import { createPortal } from 'react-dom';
import { useFloating, offset, flip, shift, size, autoUpdate } from '@floating-ui/react-dom';
import { Plus, Trash2, Copy, Download, Upload, X, Sparkles, Minus } from "lucide-react";
import yaml from "js-yaml";

// Helper: find AI id from either display name or id (case-insensitive, trimmed)
const findAiIdFromValue = (val, aiItems) => {
  if (!val && val !== 0) return "";
  const s = String(val).trim();
  if (!s) return "";
  // direct id match
  const byId = (aiItems || []).find((a) => a.id === s);
  if (byId) return byId.id;
  // case-insensitive name match
  const lower = s.toLowerCase();
  const byName = (aiItems || []).find((a) => (a.name || "").trim().toLowerCase() === lower);
  return byName ? byName.id : "";
};

const MatchBuilder = () => {
  // Helper to download a file
  const downloadFile = (filename, content, type = "text/yaml") => {
    console.log("downloadFile called", { filename, type });
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to export a single team as YAML (uses display names)
  const exportSingleTeam = (team, teamName, matchName) => {
    try {
      const teamYaml = {
        matchName: matchName,
        teamName: teamName,
        members: team.map((char) => ({
          character: char.name || (characters.find(c => c.id === char.id)?.name || ""),
          costume: char.costume ? (costumes.find(c => c.id === char.costume)?.name || char.costume) : "",
          capsules: (char.capsules || []).filter(Boolean).map(cid => capsules.find(c => c.id === cid)?.name || cid),
          ai: char.ai ? (aiItems.find(ai => ai.id === char.ai)?.name || char.ai) : ""
        }))
      };
      const yamlStr = yaml.dump(teamYaml, { noRefs: true, lineWidth: 120 });
      downloadFile(`${teamName.replace(/\s+/g, "_")}.yaml`, yamlStr, "text/yaml");
      setSuccess(`Exported ${teamName} from ${matchName} as YAML.`);
    } catch (err) {
      console.error("exportSingleTeam error", err);
      setError("Failed to export team as YAML.");
    }
  };

  // Helper to import a single team YAML and map display names back to IDs, updating the match state
  const importSingleTeam = async (event, matchId, teamName) => {
    // Clear the target team first so previous selections are removed — use 5 empty slots
    const emptySlots = () => Array.from({ length: 5 }, () => ({ name: "", id: "", capsules: Array(7).fill(""), costume: "", ai: "" }));
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, [teamName]: emptySlots() } : m));
    const files = event.target.files;
    if (!files || files.length === 0) return;
    for (let file of files) {
      try {
        const text = await file.text();
        const teamYaml = yaml.load(text);
        if (!teamYaml || !teamYaml.members) throw new Error("Invalid team YAML");
        const newTeam = (teamYaml.members || []).map((m) => {
          console.debug('importSingleTeam: incoming member ai:', m.ai, 'aiItems.length:', aiItems.length, 'resolved:', findAiIdFromValue(m.ai, aiItems));
          const nameVal = (m.character || "").toString().trim();
          const charObj = characters.find(c => (c.name || "").trim().toLowerCase() === nameVal.toLowerCase()) || { id: "", name: nameVal };
          return {
            name: charObj.name,
            id: charObj.id || "",
            costume: m.costume ? (costumes.find(c => (c.name || "").trim().toLowerCase() === (m.costume || "").toString().trim().toLowerCase())?.id || "") : "",
            capsules: Array(7).fill("").map((_, i) => {
              if (m.capsules && m.capsules[i]) {
                const capName = (m.capsules[i] || "").toString().trim();
                return capsules.find(c => (c.name || "").trim().toLowerCase() === capName.toLowerCase())?.id || "";
              }
              return "";
            }),
            ai: m.ai ? findAiIdFromValue(m.ai, aiItems) : ""
          };
        });

        setMatches((prev) => prev.map((m) =>
          m.id === matchId
            ? { ...m, [teamName]: newTeam }
            : m
        ));
        setSuccess(`Imported ${teamName} for match ${matchId}`);
        setError("");
        try { event.target.value = null; } catch (e) {}
      } catch (e) {
        console.error("importSingleTeam error", e);
        const fname = (typeof file !== 'undefined' && file && file.name) ? file.name : 'file';
        setError("Invalid YAML file: " + fname);
        try { event.target.value = null; } catch (er) {}
        try { document.querySelectorAll('input[type=file]').forEach(i=>i.value=null); } catch(err) {}
        return;
      }
    }
  };

  // Helper to export a single match as YAML
  const exportSingleMatch = (match) => {
    const matchYaml = {
      matchName: match.name,
      team1Name: match.team1Name,
      team2Name: match.team2Name,
      team1: (match.team1 || []).map((char) => ({
        character: char.name || (characters.find(c => c.id === char.id)?.name || ""),
        costume: char.costume ? (costumes.find(c => c.id === char.costume)?.name || char.costume) : "",
        capsules: (char.capsules || []).filter(Boolean).map(cid => capsules.find(c => c.id === cid)?.name || cid),
        ai: char.ai ? (aiItems.find(ai => ai.id === char.ai)?.name || char.ai) : ""
      })),
      team2: (match.team2 || []).map((char) => ({
        character: char.name || (characters.find(c => c.id === char.id)?.name || ""),
        costume: char.costume ? (costumes.find(c => c.id === char.costume)?.name || char.costume) : "",
        capsules: (char.capsules || []).filter(Boolean).map(cid => capsules.find(c => c.id === cid)?.name || cid),
        ai: char.ai ? (aiItems.find(ai => ai.id === char.ai)?.name || char.ai) : ""
      }))
    };
    const yamlStr = yaml.dump(matchYaml, { noRefs: true, lineWidth: 120 });
    console.log("exportSingleMatch called", { matchYaml, yamlStr });
    downloadFile(`${match.name.replace(/\s+/g, "_")}.yaml`, yamlStr, "text/yaml");
    setSuccess(`Exported match ${match.name} as YAML.`);
  };

  // Helper to import a single match
  const importSingleMatch = async (event, matchId) => {
    // Clear both teams for this match before importing (5 empty slots each)
    const emptySlots = () => Array.from({ length: 5 }, () => ({ name: "", id: "", capsules: Array(7).fill(""), costume: "", ai: "" }));
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, team1: emptySlots(), team2: emptySlots() } : m));
    const files = event.target.files;
    if (!files || files.length === 0) return;
    for (let file of files) {
      const text = await file.text();
      try {
        const matchYaml = yaml.load(text);
        if (!matchYaml || !matchYaml.matchName) throw new Error("Invalid YAML");
        // Convert display names back to IDs for state
        const team1 = (matchYaml.team1 || []).map((char) => {
          console.debug('importSingleMatch: team1 member ai:', char.ai, 'aiItems.length:', aiItems.length, 'resolved:', findAiIdFromValue(char.ai, aiItems));
          const nameVal = (char.character || "").toString().trim();
          const charObj = characters.find(c => (c.name || "").trim().toLowerCase() === nameVal.toLowerCase()) || { name: nameVal, id: "" };
          return {
            name: charObj.name,
            id: charObj.id,
            costume: char.costume ? (costumes.find(c => (c.name || "").trim().toLowerCase() === (char.costume || "").toString().trim().toLowerCase())?.id || "") : "",
            capsules: Array(7).fill("").map((_, i) => {
              if (char.capsules && char.capsules[i]) {
                const capName = (char.capsules[i] || "").toString().trim();
                return capsules.find(c => (c.name || "").trim().toLowerCase() === capName.toLowerCase())?.id || "";
              }
              return "";
            }),
            ai: char.ai ? findAiIdFromValue(char.ai, aiItems) : ""
          };
        });
        const team2 = (matchYaml.team2 || []).map((char) => {
          console.debug('importSingleMatch: team2 member ai:', char.ai, 'aiItems.length:', aiItems.length, 'resolved:', findAiIdFromValue(char.ai, aiItems));
          const nameVal = (char.character || "").toString().trim();
          const charObj = characters.find(c => (c.name || "").trim().toLowerCase() === nameVal.toLowerCase()) || { name: nameVal, id: "" };
          return {
            name: charObj.name,
            id: charObj.id,
            costume: char.costume ? (costumes.find(c => (c.name || "").trim().toLowerCase() === (char.costume || "").toString().trim().toLowerCase())?.id || "") : "",
            capsules: Array(7).fill("").map((_, i) => {
              if (char.capsules && char.capsules[i]) {
                const capName = (char.capsules[i] || "").toString().trim();
                return capsules.find(c => (c.name || "").trim().toLowerCase() === capName.toLowerCase())?.id || "";
              }
              return "";
            }),
            ai: char.ai ? findAiIdFromValue(char.ai, aiItems) : ""
          };
        });
        setMatches((prev) => prev.map((m) =>
          m.id === matchId
            ? { ...m, team1, team2 }
            : m
        ));
        setSuccess(`Imported match details for match ${matchId}`);
        setError("");
        try { event.target.value = null; } catch (e) {}
      } catch (e) {
        const fname = (typeof file !== 'undefined' && file && file.name) ? file.name : 'file';
        setError("Invalid YAML file: " + fname);
        try { event.target.value = null; } catch (er) {}
        try { document.querySelectorAll('input[type=file]').forEach(i=>i.value=null); } catch(err) {}
        return;
      }
    }
  };
  const [characters, setCharacters] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [costumes, setCostumes] = useState([]);
  const [aiItems, setAiItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [collapsedMatches, setCollapsedMatches] = useState({});
  const [matchCounter, setMatchCounter] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingMatchSetup, setPendingMatchSetup] = useState(null);
  const [pendingItemSetup, setPendingItemSetup] = useState(null);

  // Show error for a duration, then fade it out before clearing
  const [errorFading, setErrorFading] = useState(false);
  useEffect(() => {
    if (!error) {
      setErrorFading(false);
      return;
    }
  // display duration before starting fade (ms)
  const DISPLAY_MS = 5000;
    // fade duration should match the CSS transition (ms)
    const FADE_MS = 700;

    setErrorFading(false);
    const toFade = setTimeout(() => {
      setErrorFading(true);
      // after fade completes, clear the error
      const toClear = setTimeout(() => setError(""), FADE_MS);
      // cleanup inner timeout if error changes
      return () => clearTimeout(toClear);
    }, DISPLAY_MS);

    return () => clearTimeout(toFade);
  }, [error]);

  // Show success for a duration, then fade it out before clearing
  const [successFading, setSuccessFading] = useState(false);
  useEffect(() => {
    if (!success) {
      setSuccessFading(false);
      return;
    }
  const DISPLAY_MS = 5000;
  const FADE_MS = 700;

    setSuccessFading(false);
    const toFade = setTimeout(() => {
      setSuccessFading(true);
      const toClear = setTimeout(() => setSuccess(""), FADE_MS);
      return () => clearTimeout(toClear);
    }, DISPLAY_MS);

    return () => clearTimeout(toFade);
  }, [success]);

  const matchFileRef = useRef(null);
  const itemFileRef = useRef(null);
  const importJsonRef = useRef(null);

  useEffect(() => {
    loadCSVFiles();
  }, []);

  const loadCSVFiles = async () => {
    try {
      await Promise.all([loadCharacters(), loadCapsules()]);
      setLoading(false);
    } catch (err) {
      setError("Error loading CSV files. Please upload them manually.");
      setLoading(false);
    }
  };

  const loadCharacters = async () => {
    try {
      const response = await fetch("characters.csv");
      const text = await response.text();
      const lines = text.split("\n");
      const chars = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const [name, id] = line.split(",");
          if (name && id) {
            chars.push({
              name: name.replace(/"/g, "").trim(),
              id: id.replace(/"/g, "").trim(),
            });
          }
        }
      }
      setCharacters(chars);
    } catch (err) {
      console.error("Failed to load characters:", err);
    }
  };

  const loadCapsules = async () => {
    try {
      const response = await fetch("capsules.csv");
      const text = await response.text();
      const lines = text.split("\n");
      const caps = [];
      const costs = [];
      const ai = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(",");
          if (parts.length >= 3) {
            const item = {
              name: parts[0].replace(/"/g, "").trim(),
              id: parts[1].replace(/"/g, "").trim(),
              type: parts[2].replace(/"/g, "").trim(),
            };

            if (parts.length >= 4) {
              item.exclusiveFor = parts[3].replace(/"/g, "").trim();
            }

            if (item.type === "Capsule") caps.push(item);
            else if (item.type === "Costume") costs.push(item);
            else if (item.type === "AI") ai.push(item);
          }
        }
      }
      setCapsules(caps);
      setCostumes(costs);
      setAiItems(ai);
    } catch (err) {
      console.error("Failed to load capsules:", err);
    }
  };

    // Helper: find AI id from either display name or id (case-insensitive, trimmed)
    const findAiIdFromValue = (val) => {
      if (!val && val !== 0) return "";
      const s = String(val).trim();
      if (!s) return "";
      // direct id match
      const byId = aiItems.find((a) => a.id === s);
      if (byId) return byId.id;
      // case-insensitive name match
      const lower = s.toLowerCase();
      const byName = aiItems.find((a) => (a.name || "").trim().toLowerCase() === lower);
      return byName ? byName.id : "";
    };

  const addMatch = () => {
    const newMatch = {
      id: matchCounter,
      name: `Match ${matchCounter}`,
      team1: [],
      team2: [],
      team1Name: "Team 1",
      team2Name: "Team 2",
    };
    setMatches([...matches, newMatch]);
    setMatchCounter(matchCounter + 1);
  };

  const duplicateMatch = (matchId) => {
    const original = matches.find((m) => m.id === matchId);
    if (!original) return;

    const duplicated = {
      id: matchCounter,
      name: `${original.name} (Copy)`,
      team1Name: original.team1Name,
      team2Name: original.team2Name,
      team1: original.team1.map((char) => ({
        ...char,
        capsules: [...char.capsules],
      })),
      team2: original.team2.map((char) => ({
        ...char,
        capsules: [...char.capsules],
      })),
    };
    setMatches([...matches, duplicated]);
    setMatchCounter(matchCounter + 1);
  };

  const removeMatch = (matchId) => {
    setMatches(matches.filter((m) => m.id !== matchId));
  };

  const clearAllMatches = () => {
    if (window.confirm("Clear all matches?")) {
      setMatches([]);
      setMatchCounter(1);
    }
  };

  const addCharacter = (matchId, teamName) => {
    setMatches(
      matches.map((match) => {
        if (match.id === matchId) {
          const team = match[teamName];
          if (team.length >= 5) {
            alert("Maximum 5 characters per team");
            return match;
          }
          return {
            ...match,
            [teamName]: [
              ...team,
              {
                name: "",
                id: "",
                capsules: Array(7).fill(""),
                costume: "",
                ai: "",
              },
            ],
          };
        }
        return match;
      })
    );
  };

  const removeCharacter = (matchId, teamName, index) => {
    setMatches(
      matches.map((match) => {
        if (match.id === matchId) {
          return {
            ...match,
            [teamName]: match[teamName].filter((_, i) => i !== index),
          };
        }
        return match;
      })
    );
  };

  const updateCharacter = (matchId, teamName, index, field, value) => {
    setMatches(
      matches.map((match) => {
        if (match.id === matchId) {
          const team = [...match[teamName]];
          team[index] = { ...team[index], [field]: value };

          if (field === "id") {
            const char = characters.find((c) => c.id === value);
            if (char) {
              team[index].name = char.name;
              team[index].costume = "";
            }
          }

          return { ...match, [teamName]: team };
        }
        return match;
      })
    );
  };

  // Replace entire character slot atomically to avoid merge/race conditions
  const replaceCharacter = (matchId, teamName, index, slotObj) => {
    setMatches(prev => prev.map(match => {
      if (match.id !== matchId) return match;
      const team = [...match[teamName]];

      // Normalize the incoming slot object to ensure predictable shape
      const normalized = {
        name: slotObj?.name || "",
        id: slotObj?.id || "",
        costume: slotObj?.costume || "",
        ai: slotObj?.ai || "",
        capsules: Array.isArray(slotObj?.capsules)
          ? slotObj.capsules.map((c) => (c || ""))
          : Array(7).fill("")
      };

      // Guarantee exactly 7 capsule slots
      if (normalized.capsules.length < 7) {
        normalized.capsules = [...normalized.capsules, ...Array(7 - normalized.capsules.length).fill("")];
      } else if (normalized.capsules.length > 7) {
        normalized.capsules = normalized.capsules.slice(0, 7);
      }

      if (index < 0) return match;

      // If the team array is shorter than the target index, extend with empty slots
      while (index >= team.length) {
        team.push({ name: "", id: "", capsules: Array(7).fill(""), costume: "", ai: "" });
      }
      // Debug: log previous and new slot for visibility when importing
      // replaceCharacter performed (debug logs removed)

      team[index] = normalized;
      return { ...match, [teamName]: team };
    }));
  };

  const updateCapsule = (matchId, teamName, charIndex, capsuleIndex, value) => {
    setMatches(
      matches.map((match) => {
        if (match.id === matchId) {
          const team = [...match[teamName]];
          team[charIndex].capsules[capsuleIndex] = value;
          return { ...match, [teamName]: team };
        }
        return match;
      })
    );
  };

  // Allow renaming a match
  const updateMatchName = (matchId, newName) => {
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, name: newName } : m)));
  };

  // Allow renaming a team's display name (team1Name / team2Name)
  const updateTeamDisplayName = (matchId, teamKey, newName) => {
    // teamKey expected to be 'team1' or 'team2'
    const field = teamKey === 'team1' ? 'team1Name' : 'team2Name';
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, [field]: newName } : m)));
  };

  const exportMatches = () => {
    if (matches.length === 0) {
      alert("No matches to export");
      return;
    }

    const matchSetup = generateMatchSetup();
    const itemSetup = generateItemSetup();

    downloadFile("MatchSetup.json", JSON.stringify(matchSetup, null, 2));
    downloadFile("ItemSetup.json", JSON.stringify(itemSetup, null, 2));
    setSuccess("Exported MatchSetup.json and ItemSetup.json");
  };

  const generateMatchSetup = () => {
    const setup = { matchCount: {} };

    matches.forEach((match, index) => {
      setup.matchCount[index + 1] = {
        targetTeaming: {
          com1: {
            teamMembers: Array(5)
              .fill()
              .map((_, i) => ({
                key: match.team1[i]?.id || "None",
              })),
            comLevel: "High",
          },
          com2: {
            teamMembers: Array(5)
              .fill()
              .map((_, i) => ({
                key: match.team2[i]?.id || "None",
              })),
            comLevel: "High",
          },
          player: {
            teamMembers: Array(5)
              .fill()
              .map(() => ({ key: "None" })),
            comLevel: "Middle",
          },
          player2: {
            teamMembers: Array(5)
              .fill()
              .map(() => ({ key: "None" })),
            comLevel: "Middle",
          },
        },
      };
    });

    return setup;
  };

  const generateItemSetup = () => {
    const setup = { matchCount: {} };

    matches.forEach((match, index) => {
      setup.matchCount[index + 1] = { customize: {} };

      const allChars = [...match.team1, ...match.team2];
      const uniqueChars = {};

      allChars.forEach((char) => {
        if (char.id && char.id !== "") {
          uniqueChars[char.id] = char;
        }
      });

      Object.values(uniqueChars).forEach((char) => {
        const key = `(Key="${char.id}")`;
        const allItems = [];

        if (char.costume) allItems.push({ key: char.costume });
        allItems.push(
          ...char.capsules.filter((c) => c).map((c) => ({ key: c }))
        );
        if (char.ai) allItems.push({ key: char.ai });

        if (allItems.length === 0) allItems.push({ key: "None" });

        const inTeam1 = match.team1.some((t) => t.id === char.id);
        const inTeam2 = match.team2.some((t) => t.id === char.id);

        setup.matchCount[index + 1].customize[key] = {
          targetSettings: [
            { equipItems: [{ key: "None" }], sameCharacterEquip: [] },
            { equipItems: [{ key: "None" }], sameCharacterEquip: [] },
            {
              equipItems: inTeam1 ? allItems : [{ key: "None" }],
              sameCharacterEquip: [],
            },
            {
              equipItems: inTeam2 ? allItems : [{ key: "None" }],
              sameCharacterEquip: [],
            },
          ],
        };
      });
    });

    return setup;
  };

  const handleImportMatches = async (event) => {
    // Clear all existing matches first
    setMatches([]);
    const files = event.target.files;
    if (!files || files.length === 0) return;
    let matchSetup = null;
    let itemSetup = null;
    for (let file of files) {
      const text = await file.text();
      try {
        const json = JSON.parse(text);
        if (json.matchCount) {
          // Heuristic: if customize keys exist, it's itemSetup
          const isItemSetup = Object.values(json.matchCount)[0]?.customize !== undefined;
          if (isItemSetup) itemSetup = json;
          else matchSetup = json;
        }
      } catch (e) {
        setError("Invalid JSON file: " + file.name);
        return;
      }
    }
    if (!matchSetup || !itemSetup) {
      setError("Both MatchSetup.json and ItemSetup.json are required.");
      return;
    }
    // Parse matches
    const newMatches = Object.entries(matchSetup.matchCount).map(([key, matchData], idx) => {
      const team1 = matchData.targetTeaming.com1.teamMembers
        .map((m) => ({
          id: m.key !== "None" ? m.key : "",
          name: "",
          capsules: Array(7).fill(""),
          costume: "",
          ai: "",
        }))
        .filter((char) => char.id !== "");
      const team2 = matchData.targetTeaming.com2.teamMembers
        .map((m) => ({
          id: m.key !== "None" ? m.key : "",
          name: "",
          capsules: Array(7).fill(""),
          costume: "",
          ai: "",
        }))
        .filter((char) => char.id !== "");
      return {
        id: idx + 1,
        name: `Match ${idx + 1}`,
        team1,
        team2,
        team1Name: "Team 1",
        team2Name: "Team 2",
      };
    });
    // Fill in items from itemSetup
    Object.entries(itemSetup.matchCount).forEach(([key, matchData], idx) => {
      const customize = matchData.customize;
      Object.entries(customize).forEach(([charKey, charData]) => {
        const charId = charKey.match(/Key="(.*?)"/)[1];
        // Find character in team1 or team2
        for (let team of [newMatches[idx].team1, newMatches[idx].team2]) {
          const char = team.find((c) => c.id === charId);
          if (char) {
            // Fill items
            const settings = charData.targetSettings[2].equipItems.concat(charData.targetSettings[3].equipItems);
            let capsules = [];
            let costume = "";
            let ai = "";
            settings.forEach((item) => {
              if (!item.key || item.key === "None") return;
              if (item.key.startsWith("00_1_")) costume = item.key;
              else if (item.key.startsWith("00_7_")) ai = item.key;
              else capsules.push(item.key);
            });
            char.capsules = [...capsules, ...Array(7 - capsules.length).fill("")].slice(0, 7);
            char.costume = costume;
            char.ai = ai;
          }
        }
      });
    });
    setMatches(newMatches);
    setSuccess("Imported matches from JSON files.");
    setError("");
    // reset the input so the same files can be uploaded again without refresh
    try { event.target.value = null; } catch (e) { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 p-4 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-orange-400 animate-pulse mx-auto mb-4" />
          <div className="text-white text-2xl font-bold tracking-wider">Loading data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 shadow-xl mb-6 border-2 border-orange-400 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-orange-400/10"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-400 to-orange-300 text-center mb-1 tracking-tight drop-shadow-lg">
              DRAGON BALL Z LEAGUE
            </h1>
            <p className="text-xl font-bold text-blue-300 text-center tracking-widest drop-shadow">
              SPARKING! ZERO MATCH BUILDER
            </p>
          </div>
        </div>

        {error && (
          <div className={`bg-red-600 border-2 border-red-700 text-white px-4 py-3 rounded-xl mb-4 font-semibold shadow-lg transition-opacity duration-700 ${errorFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className={`bg-green-600 border-2 border-green-700 text-white px-4 py-3 rounded-xl mb-4 font-semibold shadow-lg transition-opacity duration-700 ${successFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            ✓ {success}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <button
            onClick={addMatch}
            className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border border-orange-500"
          >
            <span className="flex items-center">
              <Plus className="mr-2" size={18} />
              <span className="hidden sm:inline">ADD MATCH</span>
            </span>
          </button>
          <button
            onClick={exportMatches}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border border-green-500"
          >
            <span className="flex items-center">
              <Download className="mr-2" size={18} />
              <span className="hidden sm:inline">EXPORT ALL</span>
            </span>
          </button>
          <button
            onClick={clearAllMatches}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border border-red-500"
          >
            <span className="flex items-center">
              <Trash2 className="mr-2" size={18} />
              <span className="hidden sm:inline">CLEAR ALL</span>
            </span>
          </button>
          <label className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border border-blue-500 cursor-pointer flex items-center">
            <Upload className="mr-2" size={18} />
            <span className="hidden sm:inline">IMPORT MATCHES</span>
            <input
              type="file"
              accept="application/json"
              multiple
              style={{ display: "none" }}
              onChange={handleImportMatches}
            />
          </label>
        </div>

        <div className="space-y-6">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              characters={characters}
              capsules={capsules}
              costumes={costumes}
              aiItems={aiItems}
              onDuplicate={() => duplicateMatch(match.id)}
              onRemove={() => removeMatch(match.id)}
              onAddCharacter={(teamName) => addCharacter(match.id, teamName)}
              onRemoveCharacter={(teamName, index) =>
                removeCharacter(match.id, teamName, index)
              }
              onUpdateCharacter={(teamName, index, field, value) =>
                updateCharacter(match.id, teamName, index, field, value)
              }
              onReplaceCharacter={(teamName, index, slotObj) => replaceCharacter(match.id, teamName, index, slotObj)}
              onUpdateCapsule={(teamName, charIndex, capsuleIndex, value) =>
                updateCapsule(
                  match.id,
                  teamName,
                  charIndex,
                  capsuleIndex,
                  value
                )
              }
              collapsed={collapsedMatches[match.id] || false}
              onToggleCollapse={() => setCollapsedMatches((prev) => ({ ...prev, [match.id]: !prev[match.id] }))}
              exportSingleMatch={exportSingleMatch}
              importSingleMatch={importSingleMatch}
              exportSingleTeam={exportSingleTeam}
              importSingleTeam={importSingleTeam}
              onRenameMatch={(newName) => updateMatchName(match.id, newName)}
              onRenameTeam1={(newName) => updateTeamDisplayName(match.id, 'team1', newName)}
              onRenameTeam2={(newName) => updateTeamDisplayName(match.id, 'team2', newName)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Small accessible Combobox component (keyboard navigation, filtering)
const Combobox = ({
  valueId,
  items,
  placeholder,
  onSelect, // (id, name)
  getName = (it) => it.name,
  disabled = false,
}) => {
  const [input, setInput] = useState(() => {
    const found = items.find((it) => it.id === valueId);
    return found ? getName(found) : "";
  });
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const found = items.find((it) => it.id === valueId);
    // If we have a matching item, show its name; otherwise clear the input so stale names don't persist
    setInput(found ? getName(found) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueId, items]);

  const filtered = input
    ? items.filter((it) => getName(it).toLowerCase().includes(input.toLowerCase()))
    : items.slice(0, 50);

  // Floating UI: robust positioning, flipping, and auto-updates
  const { x, y, reference, floating, strategy, refs, update } = useFloating({
    placement: 'bottom-start',
    middleware: [
      offset(6),
      flip(),
      shift(),
      size({
        apply({ rects, availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
            maxHeight: `${Math.min(availableHeight, 400)}px`,
            overflow: 'auto',
          });
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });


  const openList = () => {
    if (!disabled) setOpen(true);
  };

  const closeList = () => {
    setOpen(false);
    setHighlight(-1);
  };

  const commitSelection = (item) => {
    if (item) {
      setInput(getName(item));
      onSelect(item.id, getName(item));
    } else {
      // no match -> clear
      setInput("");
      onSelect('', '');
    }
    closeList();
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      openList();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      openList();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && highlight >= 0 && highlight < filtered.length) {
        commitSelection(filtered[highlight]);
      } else {
        // try exact match
        const exact = items.find((it) => getName(it).toLowerCase() === input.toLowerCase());
        commitSelection(exact || null);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeList();
    }
  };

  // keep floating position updated when open
  useEffect(() => {
    if (!open) return;
    // ensure reference is registered
    reference(inputRef.current);
    // update() will be called automatically by autoUpdate, but call once to be sure
    if (typeof update === 'function') update();
  }, [open, reference, update]);

  return (
    <div className="relative" onKeyDown={onKeyDown}>
      <input
        ref={(el) => { inputRef.current = el; try { reference(el); } catch(e) {} }}
        type="text"
        value={input}
        onChange={(e) => { setInput(e.target.value); openList(); }}
        onFocus={openList}
        onBlur={() => { setTimeout(closeList, 150); }}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-slate-500 rounded text-xs font-medium bg-slate-800 text-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/50 transition-all ${disabled ? 'opacity-60' : ''}`}
        style={{ caretColor: '#fb923c' }}
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && filtered.length > 0 && (
        (typeof document !== 'undefined' && x != null && y != null)
          ? createPortal(
            <ul ref={floating} role="listbox" className="z-[9999] mt-1 max-h-44 overflow-auto bg-slate-800 border border-slate-600 rounded shadow-lg" style={{ position: strategy, left: x ?? 0, top: y ?? 0 }}>
              {filtered.map((it, idx) => (
                <li
                  key={it.id || idx}
                  onMouseDown={(ev) => { ev.preventDefault(); commitSelection(it); }}
                  onMouseEnter={() => setHighlight(idx)}
                  className={`px-3 py-2 cursor-pointer text-sm ${highlight === idx ? 'bg-slate-700 text-white' : 'text-slate-200'}`}
                >
                  {getName(it)}
                </li>
              ))}
            </ul>,
            document.body
          ) : (
            <ul ref={listRef} className="absolute z-50 mt-1 max-h-44 w-full overflow-auto bg-slate-800 border border-slate-600 rounded shadow-lg">
              {filtered.map((it, idx) => (
                <li
                  key={it.id || idx}
                  onMouseDown={(ev) => { ev.preventDefault(); commitSelection(it); }}
                  onMouseEnter={() => setHighlight(idx)}
                  className={`px-3 py-2 cursor-pointer text-sm ${highlight === idx ? 'bg-slate-700 text-white' : 'text-slate-200'}`}
                >
                  {getName(it)}
                </li>
              ))}
            </ul>
          )
      )}
    </div>
  );
};

const MatchCard = ({
  match,
  characters,
  capsules,
  costumes,
  aiItems,
  onDuplicate,
  onRemove,
  onAddCharacter,
  onRemoveCharacter,
  onUpdateCharacter,
  onUpdateCapsule,
  onReplaceCharacter,
  collapsed,
  onToggleCollapse,
  exportSingleMatch,
  importSingleMatch,
  exportSingleTeam,
  importSingleTeam,
  onRenameMatch,
  onRenameTeam1,
  onRenameTeam2,
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 shadow-xl border-2 border-orange-400/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400"></div>
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 pb-3 border-b border-slate-600">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded bg-slate-700 text-orange-300 border border-orange-400 hover:bg-orange-400 hover:text-slate-800 transition-all flex items-center justify-center"
            aria-label={collapsed ? `Expand Match` : `Collapse Match`}
            style={{ width: 28, height: 28 }}
          >
            {collapsed ? <Plus size={18} /> : <Minus size={18} />}
          </button>
          <input
            type="text"
            value={match.name}
            onChange={(e) => typeof onRenameMatch === 'function' ? onRenameMatch(e.target.value) : null}
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-400 bg-transparent border-b-2 border-transparent hover:border-orange-400 focus:border-orange-400 outline-none px-2 py-1 rounded transition-all"
            style={{ caretColor: '#fb923c' }}
          />
        </div>
  <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
          <button
            onClick={() => exportSingleMatch(match)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-2 rounded-lg shadow-md hover:scale-105 transition-all border border-purple-500 flex items-center justify-center"
            aria-label="Download Match"
          >
            <Download size={18} />
            <span className="sr-only">Download Match</span>
          </button>
          <label className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg shadow-md hover:scale-105 transition-all border border-blue-500 cursor-pointer flex items-center justify-center"
            aria-label="Upload Match"
          >
            <Upload size={18} />
            <span className="sr-only">Upload Match</span>
              <input
                type="file"
                accept=".yaml,application/x-yaml,text/yaml"
                multiple
                style={{ display: "none" }}
                onChange={(e) => importSingleMatch(e, match.id)}
              />
          </label>
          <button
            onClick={onDuplicate}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-2 rounded-lg font-bold text-sm shadow-md hover:scale-105 transition-all border border-green-500 flex items-center justify-center"
            aria-label="Duplicate Match"
          >
            <Copy size={16} />
            <span className="hidden sm:inline ml-2">DUP</span>
          </button>
          <button
            onClick={onRemove}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-2 rounded-lg font-bold text-sm shadow-md hover:scale-105 transition-all border border-red-500 flex items-center justify-center"
            aria-label="Remove Match"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline ml-2">REMOVE</span>
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TeamPanel
            teamName="team1"
            displayName={match.team1Name}
            team={match.team1}
            characters={characters}
            capsules={capsules}
            costumes={costumes}
            aiItems={aiItems}
            onAddCharacter={() => onAddCharacter("team1")}
            onRemoveCharacter={(index) => onRemoveCharacter("team1", index)}
            onUpdateCharacter={(index, field, value) =>
              onUpdateCharacter("team1", index, field, value)
            }
            onUpdateCapsule={(charIndex, capsuleIndex, value) =>
              onUpdateCapsule("team1", charIndex, capsuleIndex, value)
            }
            teamColor="blue"
            matchId={match.id}
            matchName={match.name}
            exportSingleTeam={exportSingleTeam}
            importSingleTeam={importSingleTeam}
            onRenameTeam={onRenameTeam1}
            onReplaceCharacter={(index, slotObj) => onReplaceCharacter('team1', index, slotObj)}
          />
          <TeamPanel
            teamName="team2"
            displayName={match.team2Name}
            team={match.team2}
            characters={characters}
            capsules={capsules}
            costumes={costumes}
            aiItems={aiItems}
            onAddCharacter={() => onAddCharacter("team2")}
            onRemoveCharacter={(index) => onRemoveCharacter("team2", index)}
            onUpdateCharacter={(index, field, value) =>
              onUpdateCharacter("team2", index, field, value)
            }
            onUpdateCapsule={(charIndex, capsuleIndex, value) =>
              onUpdateCapsule("team2", charIndex, capsuleIndex, value)
            }
            teamColor="red"
            matchId={match.id}
            matchName={match.name}
            exportSingleTeam={exportSingleTeam}
            importSingleTeam={importSingleTeam}
            onRenameTeam={onRenameTeam2}
            onReplaceCharacter={(index, slotObj) => onReplaceCharacter('team2', index, slotObj)}
          />
        </div>
      )}
    </div>
  );
}

const TeamPanel = ({
  displayName,
  team,
  characters,
  capsules,
  costumes,
  aiItems,
  onAddCharacter,
  onRemoveCharacter,
  onUpdateCharacter,
  onUpdateCapsule,
  teamColor,
  matchId,
  matchName,
  exportSingleTeam,
  importSingleTeam,
  onRenameTeam,
  teamName,
  onReplaceCharacter,
}) => {
  if (typeof exportSingleTeam !== "function") {
    console.warn("TeamPanel: exportSingleTeam prop is not a function!", exportSingleTeam);
  }
  const [collapsed, setCollapsed] = React.useState(false);
  const colorClasses = teamColor === "blue"
    ? "from-slate-800 to-slate-700 border-slate-600"
    : "from-slate-800 to-slate-700 border-slate-600";
  const buttonColor = teamColor === "blue"
    ? "from-slate-700 to-slate-600 border-slate-500 hover:from-slate-600 hover:to-slate-500"
    : "from-slate-700 to-slate-600 border-slate-500 hover:from-slate-600 hover:to-slate-500";

  const [localName, setLocalName] = React.useState(displayName || '');
  React.useEffect(() => {
    setLocalName(displayName || '');
  }, [displayName]);

  const handleRename = (e) => {
    const v = e?.target?.value;
    setLocalName(v);
    if (typeof onRenameTeam === 'function') onRenameTeam(v);
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses} rounded-xl p-4 shadow-lg border-2 relative overflow-visible`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 pointer-events-none"></div>
      <div className="flex justify-between items-center mb-3">
        <div>
          <input
            type="text"
            value={localName}
            onChange={handleRename}
            className="text-lg font-bold text-orange-300 uppercase tracking-wide drop-shadow relative z-10 bg-transparent border-b border-transparent focus:border-orange-400 outline-none px-1 py-0"
          />
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => exportSingleTeam(team, displayName, matchName)}
            className="p-1 rounded bg-purple-700 text-white border border-purple-400 hover:bg-purple-400 hover:text-slate-800 transition-all flex items-center justify-center z-20"
            aria-label={`Download ${displayName}`}
            style={{ width: 28, height: 28 }}
          >
            <Download size={16} />
            <span className="sr-only">Download {displayName}</span>
          </button>
          <label className="p-1 rounded bg-blue-700 text-white border border-blue-400 hover:bg-blue-400 hover:text-slate-800 transition-all flex items-center justify-center z-20 cursor-pointer" aria-label={`Upload ${displayName}`}
            style={{ width: 28, height: 28 }}>
            <Upload size={16} />
            <span className="sr-only">Upload {displayName}</span>
            <input
              type="file"
              accept=".yaml,application/x-yaml,text/yaml"
              multiple
              style={{ display: "none" }}
              onChange={(e) => importSingleTeam(e, matchId, teamName)}
            />
          </label>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-2 p-1 rounded bg-slate-700 text-orange-300 border border-orange-400 hover:bg-orange-400 hover:text-slate-800 transition-all flex items-center justify-center z-20"
            aria-label={collapsed ? `Expand ${displayName}` : `Collapse ${displayName}`}
            style={{ width: 24, height: 24 }}
          >
            {collapsed ? <Plus size={16} /> : <Minus size={16} />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className="space-y-3 relative z-10">
            {team.map((char, index) => (
              <CharacterSlot
                key={index}
                index={index}
                teamName={teamName}
                matchId={matchId}
                matchName={matchName}
                character={char}
                characters={characters}
                capsules={capsules}
                costumes={costumes}
                aiItems={aiItems}
                onRemove={() => onRemoveCharacter(index)}
                onUpdate={(field, value) => onUpdateCharacter(index, field, value)}
                onUpdateCapsule={(capsuleIndex, value) =>
                  onUpdateCapsule(index, capsuleIndex, value)
                }
                onReplaceCharacter={(slotObj) => onReplaceCharacter(index, slotObj)}
              />
            ))}
          </div>
          <button
            onClick={onAddCharacter}
            className={`w-full mt-4 bg-gradient-to-r ${buttonColor} text-white py-2 rounded-lg font-bold text-sm shadow-md hover:scale-105 transition-all border-2 relative z-0`}
          >
            <Plus className="inline mr-1" size={16} />
            ADD CHARACTER
          </button>
        </>
      )}
    </div>
  );
};
    
const CharacterSlot = ({
  index,
  teamName,
  matchId,
  matchName,
  character,
  characters,
  capsules,
  costumes,
  aiItems,
  onRemove,
  onUpdate,
  onUpdateCapsule,
  onReplaceCharacter,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const charCostumes = costumes.filter(
    (c) => c.exclusiveFor === character.name
  );
  const fileInputRef = React.useRef(null);

  return (
  <div className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-300 border border-slate-500 flex flex-col relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 space-y-2">
          <div>
            <label className="block text-xs font-semibold text-orange-300 mb-1 uppercase tracking-wide">
              Character
            </label>
            <Combobox
              valueId={character.id}
              items={characters}
              getName={(c) => c.name}
              placeholder="Type or select character"
              onSelect={(id) => onUpdate('id', id)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-300 mb-1 uppercase tracking-wide">
              Costume
            </label>
            <Combobox
              valueId={character.costume}
              items={charCostumes}
              getName={(c) => c.name}
              placeholder="Type or select costume"
              onSelect={(id) => onUpdate('costume', id)}
              disabled={!character.name}
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded bg-slate-700 text-orange-300 border border-orange-400 hover:bg-orange-400 hover:text-slate-800 transition-all flex items-center justify-center"
            aria-label={collapsed ? `Expand Character` : `Collapse Character`}
            style={{ width: 24, height: 24 }}
          >
            {collapsed ? <Plus size={16} /> : <Minus size={16} />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="space-y-2 mt-3">
          <label className="block text-xs font-semibold text-cyan-300 mb-1 uppercase tracking-wide">
            Capsules
          </label>
          {character.capsules.map((capsule, i) => (
            <div key={i} className="mb-1">
              <Combobox
                valueId={capsule}
                items={capsules}
                getName={(c) => c.name}
                placeholder={`Capsule ${i + 1}`}
                onSelect={(id) => onUpdateCapsule(i, id)}
              />
            </div>
          ))}

          <div className="mt-2 pt-2 border-t border-slate-500">
            <label className="block text-xs font-semibold text-blue-300 mb-1 uppercase tracking-wide">
              AI Strategy
            </label>
            <Combobox
              valueId={character.ai}
              items={aiItems}
              getName={(a) => a.name}
              placeholder="Type or select AI strategy"
              onSelect={(id) => onUpdate('ai', id)}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Export current character build as YAML
                    const build = {
                      character: character.name || (characters.find(c => c.id === character.id)?.name || ''),
                      costume: character.costume ? (costumes.find(c => c.id === character.costume)?.name || '') : '',
                      capsules: (character.capsules || []).map(cid => capsules.find(c => c.id === cid)?.name || ''),
                      ai: character.ai ? (aiItems.find(a => a.id === character.ai)?.name || '') : '',
                      matchName: matchName,
                      teamName: teamName,
                      slotIndex: index,
                    };
                    const yamlStr = yaml.dump(build, { noRefs: true, lineWidth: 120 });
                    const blob = new Blob([yamlStr], { type: 'text/yaml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const charName = character.name || (characters.find(c => c.id === character.id)?.name || '');
                    const safe = charName && charName.trim() !== '' ? charName.replace(/\s+/g, '_') : 'Blank';
                    a.download = `${safe}.yaml`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="mt-4 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-sm shadow hover:scale-105 transition-all border border-purple-500 inline-flex items-center"
                  aria-label="Export character build"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline ml-2">Export</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".yaml,application/x-yaml,text/yaml"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const files = e.target.files; if (!files || !files[0]) return; try {
                      const text = await files[0].text();
                      const data = yaml.load(text);
                      if (!data) throw new Error('Invalid YAML');

                      // Build a full slot object (ids) and replace atomically
                      const slot = {
                        name: '',
                        id: '',
                        costume: '',
                        capsules: Array(7).fill(''),
                        ai: '',
                      };

                      if (data.character) {
                        const charObj = characters.find(c => (c.name || '').toString().trim().toLowerCase() === data.character.toString().trim().toLowerCase());
                        slot.name = data.character.toString();
                        slot.id = charObj ? charObj.id : '';
                      }

                      if (data.costume) {
                        const costumeObj = costumes.find(c => (c.name || '').toString().trim().toLowerCase() === data.costume.toString().trim().toLowerCase());
                        slot.costume = costumeObj ? costumeObj.id : '';
                      }

                      if (data.ai) {
                        slot.ai = findAiIdFromValue(data.ai, aiItems);
                      }

                      if (Array.isArray(data.capsules)) {
                        slot.capsules = Array(7).fill('').map((_, i) => {
                          if (!data.capsules[i]) return '';
                          const found = capsules.find(cap => (cap.name || '').toString().trim().toLowerCase() === data.capsules[i].toString().trim().toLowerCase());
                          return found ? found.id : '';
                        });
                      }

                      // Debug: show parsed YAML and constructed slot object before applying
                      // parsed YAML and constructed slot (debug logs removed)

                      if (typeof onReplaceCharacter === 'function') {
                        onReplaceCharacter(slot);
                      } else {
                        // Fallback: apply updates individually (legacy)
                        console.error('CharacterSlot import: onReplaceCharacter not provided, falling back to per-field updates');
                        onUpdate('id', slot.id);
                        onUpdate('costume', slot.costume);
                        slot.capsules.forEach((cid, ci) => onUpdateCapsule(ci, cid));
                        onUpdate('ai', slot.ai);
                      }
                    } catch (err) { console.error('import character build failed', err); }
                    try { e.target.value = null; } catch (e) {}
                  }}
                />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm shadow hover:scale-105 transition-all border border-blue-400 inline-flex items-center"
                        aria-label="Import character build"
                      >
                        <Upload size={14} />
                        <span className="hidden sm:inline ml-2">Import</span>
                      </button>
            </div>

            <div>
                <button
                  onClick={onRemove}
                  className="mt-4 px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-sm shadow hover:scale-105 transition-all border border-red-400 inline-flex items-center"
                  aria-label="Remove character"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline ml-2">Remove</span>
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchBuilder;