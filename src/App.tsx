import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useState } from "react";
import { useEffect } from "react";
import * as CryptoJS from "crypto-js";
import addDays from "date-fns/addDays";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import DeleteIcon from "@mui/icons-material/Delete";
import format from "date-fns/format";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import LoadingButton from "@mui/lab/LoadingButton";
import MenuItem from "@mui/material/MenuItem";
import crypto from "crypto";
import Select from "@mui/material/Select";
import subDays from "date-fns/subDays";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import "./styles.css";

const FORMAT_DATE = "yyyy-MM-dd";

type EncryptionValues = "no-encryption" | "tripledes" | "aes" | "aes256";

const encryptHMAC = async (
  secretKey: string,
  message: string,
  algorithm = "SHA-256"
) => {
  const encoder = new TextEncoder();
  const messageUint8Array = encoder.encode(message);
  const keyUint8Array = encoder.encode(secretKey);

  // Import the secretKey as a CryptoKey
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyUint8Array,
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"]
  );

  // Sign the message with HMAC and the CryptoKey
  const signature = await window.crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    messageUint8Array
  );

  // Convert the signature ArrayBuffer to a hex string
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
};

const encryptDESede = (
  encryption: Omit<EncryptionValues, "no-encryption">,
  key: string,
  input: string
) => {
  let BLOCKSIZE = 8;
  if (encryption === "aes") {
    BLOCKSIZE = 16;
  } else if (encryption === "aes256") {
    BLOCKSIZE = 32;
  }

  // The initialization vector needed by the CBC mode
  const IV = Buffer.alloc(BLOCKSIZE);
  let retString = "";

  if (encryption === "aes256") {
    const encryptCipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(key),
      IV
    );
    const inputBytes = Buffer.from(input, "utf-8");
    let outBuf = encryptCipher.update(inputBytes);
    outBuf = Buffer.concat([outBuf, encryptCipher.final()]);
    retString = outBuf.toString("base64");
  } else {
    const encryptCipher = crypto.createCipheriv(
      encryption + "-cbc",
      Buffer.from(key),
      IV
    );
    const inputBytes = Buffer.from(input, "utf-8");
    const cipherBlock = Buffer.concat([
      encryptCipher.update(inputBytes),
      encryptCipher.final()
    ]);
    retString = cipherBlock.toString("base64");
  }

  return retString;
};

function App() {
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");

  const [surveyId, setSurveyId] = useState("");
  const [pmsId, setPmsId] = useState("");

  const [checkin, setCheckin] = useState(
    format(subDays(new Date(), 14), FORMAT_DATE)
  );
  const [checkout, setCheckout] = useState(
    format(subDays(new Date(), 12), FORMAT_DATE)
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [params, setParams] = useState<Record<string, string>>({});

  const [numberOfGuests, setNumberOfGuests] = useState(10);
  const [multipleGuests, setMultipleGuests] = useState(false);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [prod, setProd] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [encryptionType, setEncryptionType] = useState<EncryptionValues>(
    "no-encryption"
  );

  useEffect(() => {
    setLinks([]);
  }, [
    apiKey,
    checkin,
    checkout,
    email,
    encryptionType,
    firstName,
    lastName,
    multipleGuests,
    numberOfGuests,
    params,
    pmsId,
    prod,
    secretKey,
    surveyId
  ]);

  return (
    <div className="App">
      <Grid container spacing={2}>
        <Grid item sm={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h3">Links generator</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">Environment</Typography>
            </Grid>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={prod}
                      onChange={() => {
                        setProd(!prod);
                      }}
                    />
                  }
                  label="Production"
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">Keys</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                id="apiKey"
                fullWidth
                label="ApiKey"
                onChange={(event) => {
                  setApiKey(event.target.value);
                }}
                required
                variant="outlined"
                value={apiKey}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                id="secretKey"
                label="SecretKey"
                onChange={(event) => {
                  setSecretKey(event.target.value);
                }}
                required
                variant="outlined"
                value={secretKey}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">Scope</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                id="surveyId"
                label="Survey ID"
                onChange={(event) => {
                  setSurveyId(event.target.value);
                }}
                required
                variant="outlined"
                value={surveyId}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                id="pmsId"
                fullWidth
                label="PMS ID"
                onChange={(event) => {
                  setPmsId(event.target.value);
                }}
                required
                variant="outlined"
                value={pmsId}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">Guests</Typography>
            </Grid>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={multipleGuests}
                      onChange={() => {
                        setMultipleGuests(!multipleGuests);
                        setLinks([]);
                      }}
                    />
                  }
                  label="Multiple Guests"
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <Collapse in={multipleGuests}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      id="numberGuests"
                      inputProps={{
                        inputMode: "numeric",
                        max: 20,
                        min: 2
                      }}
                      fullWidth
                      label="Number of guests"
                      onChange={(event) => {
                        setNumberOfGuests(+event.target.value);
                      }}
                      required
                      type="number"
                      variant="outlined"
                      value={numberOfGuests}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <DatePicker
                      format={FORMAT_DATE}
                      label="Checkin"
                      onChange={(value) => {
                        if (value) {
                          setCheckin(format(new Date(value), FORMAT_DATE));
                        }
                      }}
                      sx={{ width: "100% " }}
                      value={checkin ? new Date(checkin) : new Date()}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <DatePicker
                      format={FORMAT_DATE}
                      label="Checkout"
                      onChange={(value) => {
                        if (value) {
                          setCheckout(format(new Date(value), FORMAT_DATE));
                        }
                      }}
                      sx={{ width: "100% " }}
                      value={
                        checkout ? new Date(checkout) : addDays(new Date(), 1)
                      }
                    />
                  </Grid>
                </Grid>
              </Collapse>
              <Collapse in={!multipleGuests}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      id="firstName"
                      fullWidth
                      label="First Name"
                      onChange={(event) => {
                        setFirstName(event.target.value);
                      }}
                      variant="outlined"
                      value={firstName}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      id="lastName"
                      fullWidth
                      label="Last Name"
                      onChange={(event) => {
                        setLastName(event.target.value);
                      }}
                      variant="outlined"
                      value={lastName}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      id="email"
                      fullWidth
                      label="Email"
                      onChange={(event) => {
                        setEmail(event.target.value);
                      }}
                      required
                      variant="outlined"
                      value={email}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <DatePicker
                      format={FORMAT_DATE}
                      label="Checkin"
                      onChange={(value) => {
                        if (value) {
                          setCheckin(format(new Date(value), FORMAT_DATE));
                        }
                      }}
                      sx={{ width: "100% " }}
                      value={new Date(checkin)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <DatePicker
                      format={FORMAT_DATE}
                      label="Checkout"
                      onChange={(value) => {
                        if (value) {
                          setCheckout(format(new Date(value), FORMAT_DATE));
                        }
                      }}
                      sx={{ width: "100% " }}
                      value={new Date(checkout)}
                    />
                  </Grid>
                </Grid>
              </Collapse>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">Params</Typography>
            </Grid>
            {Object.keys(params).map((key) => (
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={5}>
                    <TextField
                      disabled
                      id={key}
                      fullWidth
                      label="Key"
                      variant="outlined"
                      value={key}
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      error={!params[key]}
                      fullWidth
                      label="Value"
                      onChange={(event) => {
                        setParams((prevState) => ({
                          ...prevState,
                          [key]: event.target.value
                        }));
                      }}
                      required
                      variant="outlined"
                      value={params[key]}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: 1
                      }}
                    >
                      <IconButton
                        onClick={() => {
                          setParams((prevState) => {
                            const newState = JSON.parse(
                              JSON.stringify(prevState)
                            );
                            delete newState[key];

                            return newState;
                          });
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={5}>
                  <TextField
                    id="key"
                    fullWidth
                    label="Key"
                    onChange={(event) => {
                      setKey(event.target.value);
                    }}
                    variant="outlined"
                    value={key}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    disabled={!key}
                    id="value"
                    fullWidth
                    label="Value"
                    onChange={(event) => {
                      setValue(event.target.value);
                    }}
                    variant="outlined"
                    value={value}
                  />
                </Grid>
                <Grid item xs={2}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: 1
                    }}
                  >
                    <IconButton
                      disabled={!key || !value}
                      onClick={() => {
                        setParams((prevState) => ({
                          ...prevState,
                          [key]: value
                        }));
                        setKey("");
                        setValue("");
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">Encryption</Typography>
            </Grid>
            <Grid item xs={12}>
              <Select
                onChange={(event) => {
                  setEncryptionType(event.target.value as EncryptionValues);
                }}
                value={encryptionType}
              >
                <MenuItem value="no-encryption">No encryption</MenuItem>
                <MenuItem value="tripledes">Tripledes</MenuItem>
                <MenuItem disabled value="aes256">
                  AES256 (Pending)
                </MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid item xs={12}>
              {encryptionType === "no-encryption" && multipleGuests && (
                <LoadingButton
                  disabled={
                    !apiKey ||
                    !secretKey ||
                    !surveyId ||
                    !pmsId ||
                    numberOfGuests <= 0 ||
                    (!!key && !value)
                  }
                  loading={isCreating}
                  onClick={async () => {
                    setLinks([]);
                    setIsCreating(true);

                    setLinks(
                      await Promise.all(
                        Array(numberOfGuests)
                          .fill(0)
                          .map(async (_) => {
                            const values = [
                              "apiKey",
                              "checkin",
                              "checkout",
                              "email",
                              "firstName",
                              "lastName",
                              "pmsId",
                              "surveyId",
                              ...Object.keys(params)
                            ];

                            const sorted = values.sort();
                            const [text, urlParams] = sorted.reduce(
                              ([t, uP], item) => {
                                let value = params[item];
                                const random = Math.round(
                                  Math.random() * numberOfGuests * 10000
                                );

                                if (item === "apiKey") {
                                  value = apiKey;
                                } else if (item === "checkin") {
                                  value = checkin;
                                } else if (item === "checkout") {
                                  value = checkout;
                                } else if (item === "email") {
                                  value = `test.email.${random}@shijigroup.com`;
                                } else if (item === "firstName") {
                                  value = `Test`;
                                } else if (item === "lastName") {
                                  value = `${random}`;
                                } else if (item === "pmsId") {
                                  value = pmsId;
                                } else if (item === "surveyId") {
                                  value = surveyId;
                                }

                                t += value;
                                uP[item] = value;

                                return [t, uP];
                              },
                              ["", {} as Record<string, string>]
                            );

                            urlParams.sig = await encryptHMAC(secretKey, text);

                            return `https://surveys.${
                              prod ? "" : "qa1."
                            }reviewpro.com/feedback/mail?${new URLSearchParams(
                              urlParams
                            ).toString()}`;
                          })
                      )
                    );

                    setIsCreating(false);
                  }}
                  variant="contained"
                >
                  Create Guests
                </LoadingButton>
              )}
              {encryptionType === "no-encryption" && !multipleGuests && (
                <LoadingButton
                  disabled={
                    !apiKey ||
                    !secretKey ||
                    !surveyId ||
                    !pmsId ||
                    !email ||
                    (!!key && !value)
                  }
                  loading={isCreating}
                  onClick={async () => {
                    setLinks([]);
                    setIsCreating(true);

                    const values = [
                      "apiKey",
                      "checkin",
                      "checkout",
                      "email",
                      "pmsId",
                      "surveyId",
                      ...Object.keys(params)
                    ];

                    if (firstName) {
                      values.push("firstName");
                    }

                    if (lastName) {
                      values.push("lastName");
                    }

                    const sorted = values.sort();
                    const [text, urlParams] = sorted.reduce(
                      ([t, uP], item) => {
                        let value = params[item];

                        if (item === "apiKey") {
                          value = apiKey;
                        } else if (item === "checkin") {
                          value = checkin;
                        } else if (item === "checkout") {
                          value = checkout;
                        } else if (item === "email") {
                          value = email;
                        } else if (item === "firstName") {
                          value = firstName;
                        } else if (item === "lastName") {
                          value = lastName;
                        } else if (item === "pmsId") {
                          value = pmsId;
                        } else if (item === "surveyId") {
                          value = surveyId;
                        }

                        t += value;
                        uP[item] = value;

                        return [t, uP];
                      },
                      ["", {} as Record<string, string>]
                    );

                    urlParams.sig = await encryptHMAC(secretKey, text);

                    setLinks([
                      `https://surveys.${
                        prod ? "" : "qa1."
                      }reviewpro.com/feedback/mail?${new URLSearchParams(
                        urlParams
                      ).toString()}`
                    ]);

                    setIsCreating(false);
                  }}
                  variant="contained"
                >
                  Create Guest
                </LoadingButton>
              )}
              {encryptionType !== "no-encryption" && multipleGuests && (
                <LoadingButton
                  disabled={
                    !apiKey ||
                    !secretKey ||
                    !surveyId ||
                    !pmsId ||
                    numberOfGuests <= 0 ||
                    (!!key && !value)
                  }
                  loading={isCreating}
                  onClick={async () => {
                    setLinks([]);
                    setIsCreating(true);

                    setLinks(
                      await Promise.all(
                        Array(numberOfGuests)
                          .fill(0)
                          .map(async (_) => {
                            const values = [
                              "checkin",
                              "checkout",
                              "email",
                              "pmsId",
                              "surveyId",
                              ...Object.keys(params)
                            ];

                            if (firstName) {
                              values.push("firstName");
                            }

                            if (lastName) {
                              values.push("lastName");
                            }

                            const sorted = values.sort();
                            const text = sorted.reduce((urlParams, item) => {
                              const random = Math.round(
                                Math.random() * numberOfGuests * 10000
                              );

                              if (item === "checkin") {
                                urlParams[item] = checkin;
                              } else if (item === "checkout") {
                                urlParams[item] = checkout;
                              } else if (item === "email") {
                                urlParams[
                                  item
                                ] = `test.email.${random}@shijigroup.com`;
                              } else if (item === "firstName") {
                                urlParams[item] = "Test";
                              } else if (item === "lastName") {
                                urlParams[item] = `${random}`;
                              } else if (item === "pmsId") {
                                urlParams[item] = pmsId;
                              } else if (item === "surveyId") {
                                urlParams[item] = surveyId;
                              }

                              return urlParams;
                            }, {} as Record<string, string>);

                            let key = "";

                            try {
                              key = encryptDESede(
                                encryptionType === "tripledes"
                                  ? "des-ede3"
                                  : encryptionType,
                                secretKey,
                                new URLSearchParams(text).toString()
                              );
                            } catch (_) {
                              setIsCreating(false);
                            }

                            const urlEncryptedParams = {
                              apiKey,
                              encryption: encryptionType,
                              key: encodeURI(key)
                            };

                            return `https://surveys.${
                              prod ? "" : "qa1."
                            }reviewpro.com/feedback/mail?${new URLSearchParams(
                              urlEncryptedParams
                            ).toString()}`;
                          })
                      )
                    );

                    setIsCreating(false);
                  }}
                  variant="contained"
                >
                  Create Guests
                </LoadingButton>
              )}
              {encryptionType !== "no-encryption" && !multipleGuests && (
                <LoadingButton
                  disabled={
                    !apiKey ||
                    !secretKey ||
                    !surveyId ||
                    !pmsId ||
                    !email ||
                    (!!key && !value)
                  }
                  loading={isCreating}
                  onClick={async () => {
                    setLinks([]);
                    setIsCreating(true);

                    const values = [
                      "checkin",
                      "checkout",
                      "email",
                      "pmsId",
                      "surveyId",
                      ...Object.keys(params)
                    ];

                    if (firstName) {
                      values.push("firstName");
                    }

                    if (lastName) {
                      values.push("lastName");
                    }

                    const sorted = values.sort();
                    const text = sorted.reduce((urlParams, item) => {
                      if (item === "checkin") {
                        urlParams[item] = checkin;
                      } else if (item === "checkout") {
                        urlParams[item] = checkout;
                      } else if (item === "email") {
                        urlParams[item] = email;
                      } else if (item === "firstName") {
                        urlParams[item] = firstName;
                      } else if (item === "lastName") {
                        urlParams[item] = lastName;
                      } else if (item === "pmsId") {
                        urlParams[item] = pmsId;
                      } else if (item === "surveyId") {
                        urlParams[item] = surveyId;
                      }

                      return urlParams;
                    }, {} as Record<string, string>);

                    let key = "";

                    try {
                      key = encryptDESede(
                        encryptionType === "tripledes"
                          ? "des-ede3"
                          : encryptionType,
                        secretKey,
                        new URLSearchParams(text).toString()
                      );
                    } catch (_) {
                      setIsCreating(false);
                    }

                    const urlEncryptedParams = {
                      apiKey,
                      encryption: encryptionType,
                      key: encodeURI(key)
                    };

                    setLinks([
                      `https://surveys.${
                        prod ? "" : "qa1."
                      }reviewpro.com/feedback/mail?${new URLSearchParams(
                        urlEncryptedParams
                      ).toString()}`
                    ]);

                    setIsCreating(false);
                  }}
                  variant="contained"
                >
                  Create Guest
                </LoadingButton>
              )}
            </Grid>
            <Grid item xs={12}>
              <Collapse in={links.length > 0}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6">Links</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <List dense>
                      {links.map((link, index) => (
                        <ListItem key={link}>
                          <Link href={link} target="_blank">
                            Link {index + 1}
                          </Link>
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </Collapse>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}

export default App;
