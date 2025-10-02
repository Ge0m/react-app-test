import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Copy, Download, Upload, X } from "lucide-react";

const MatchBuilder = () => {
  const [characters, setCharacters] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [costumes, setCostumes] = useState([]);
  const [aiItems, setAiItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchCounter, setMatchCounter] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingMatchSetup, setPendingMatchSetup] = useState(null);
  const [pendingItemSetup, setPendingItemSetup] = useState(null);

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

  const downloadFile = (filename, content) => {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-yellow-500 p-4 flex items-center justify-center">
        <div className="text-white text-2xl">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-yellow-500 p-4">
      <div className="max-w-7xl mx-auto bg-white/95 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-5xl font-bold text-orange-600 text-center mb-8">
          🐉 Dragon Ball Sparking Zero Match Builder
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={addMatch}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
          >
            <Plus className="inline mr-2" size={20} />
            Add Match
          </button>
          <button
            onClick={exportMatches}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
          >
            <Download className="inline mr-2" size={20} />
            Export All
          </button>
          <button
            onClick={clearAllMatches}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all"
          >
            <Trash2 className="inline mr-2" size={20} />
            Clear All
          </button>
        </div>

        <div className="space-y-8">
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
              onUpdateCapsule={(teamName, charIndex, capsuleIndex, value) =>
                updateCapsule(
                  match.id,
                  teamName,
                  charIndex,
                  capsuleIndex,
                  value
                )
              }
            />
          ))}
        </div>
      </div>
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
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border-4 border-orange-500 shadow-xl">
      <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-orange-500">
        <input
          type="text"
          value={match.name}
          onChange={(e) => {}}
          className="text-2xl font-bold text-orange-600 bg-transparent border-b-2 border-transparent hover:border-orange-300 focus:border-orange-500 outline-none px-2"
        />
        <div className="flex gap-2">
          <button
            onClick={onDuplicate}
            className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-green-600"
          >
            <Copy size={16} className="inline mr-1" />
            Duplicate
          </button>
          <button
            onClick={onRemove}
            className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-red-600"
          >
            <Trash2 size={16} className="inline mr-1" />
            Remove
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
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
        />
      </div>
    </div>
  );
};

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
}) => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-orange-500">
      <h3 className="text-xl font-bold text-orange-600 mb-4 uppercase">
        {displayName}
      </h3>

      <div className="space-y-4">
        {team.map((char, index) => (
          <CharacterSlot
            key={index}
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
          />
        ))}
      </div>

      <button
        onClick={onAddCharacter}
        className="w-full mt-4 bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-all"
      >
        <Plus className="inline mr-2" size={20} />
        Add Character
      </button>
    </div>
  );
};

const CharacterSlot = ({
  character,
  characters,
  capsules,
  costumes,
  aiItems,
  onRemove,
  onUpdate,
  onUpdateCapsule,
}) => {
  const charCostumes = costumes.filter(
    (c) => c.exclusiveFor === character.name
  );

  return (
    <div className="bg-white rounded-lg p-4 border border-orange-300">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <select
            value={character.id}
            onChange={(e) => onUpdate("id", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="">Select Character</option>
            {characters.map((char) => (
              <option key={char.id} value={char.id}>
                {char.name}
              </option>
            ))}
          </select>

          <select
            value={character.costume}
            onChange={(e) => onUpdate("costume", e.target.value)}
            className="px-3 py-2 border border-purple-300 rounded-lg text-sm font-bold bg-purple-50 focus:outline-none focus:border-purple-500"
            disabled={!character.name}
          >
            <option value="">Default Costume</option>
            {charCostumes.map((costume) => (
              <option key={costume.id} value={costume.id}>
                {costume.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onRemove}
          className="ml-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {character.capsules.map((capsule, i) => (
          <select
            key={i}
            value={capsule}
            onChange={(e) => onUpdateCapsule(i, e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="">Capsule {i + 1}</option>
            {capsules.map((cap) => (
              <option key={cap.id} value={cap.id}>
                {cap.name}
              </option>
            ))}
          </select>
        ))}

        <select
          value={character.ai}
          onChange={(e) => onUpdate("ai", e.target.value)}
          className="px-2 py-1 border border-blue-300 rounded text-xs bg-blue-50 focus:outline-none focus:border-blue-500 col-span-2"
        >
          <option value="">AI Strategy</option>
          {aiItems.map((ai) => (
            <option key={ai.id} value={ai.id}>
              {ai.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default MatchBuilder;
