// GitHub API configuration
const GITHUB_CONFIG = {
  token: 'YOUR_GITHUB_TOKEN_HERE', // Replace with your actual token
  owner: 'YOUR_USERNAME', // Replace with your GitHub username
  repo: 'YOUR_REPO_NAME', // Replace with your repository name
  branch: 'main'
};

// Base GitHub API URL
const getApiUrl = (path) => 
  `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;

// Helper function to make GitHub API requests
async function githubRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `token ${GITHUB_CONFIG.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Save data to GitHub
async function saveToGitHub(filePath, data) {
  const url = getApiUrl(filePath);
  
  try {
    // First, try to get the current file to get its SHA (needed for updates)
    let sha = null;
    try {
      const existingFile = await githubRequest(url);
      sha = existingFile.sha;
    } catch (error) {
      // File doesn't exist yet, which is fine for new files
      console.log('File does not exist yet, creating new file');
    }

    // Prepare the payload
    const payload = {
      message: `Update ${filePath}`,
      content: btoa(JSON.stringify(data, null, 2)), // Base64 encode the JSON
      branch: GITHUB_CONFIG.branch
    };

    // If file exists, include SHA for update
    if (sha) {
      payload.sha = sha;
    }

    // Create or update the file
    await githubRequest(url, 'PUT', payload);
    console.log(`Successfully saved data to ${filePath}`);
    return true;

  } catch (error) {
    console.error('Error saving to GitHub:', error);
    throw error;
  }
}

// Load data from GitHub
async function loadFromGitHub(filePath) {
  const url = getApiUrl(filePath);
  
  try {
    const fileData = await githubRequest(url);
    const content = atob(fileData.content); // Base64 decode
    return JSON.parse(content);
  } catch (error) {
    if (error.message.includes('404')) {
      console.log(`File ${filePath} does not exist yet`);
      return null;
    }
    console.error('Error loading from GitHub:', error);
    throw error;
  }
}

// Delete file from GitHub
async function deleteFromGitHub(filePath) {
  const url = getApiUrl(filePath);
  
  try {
    // Get the file's SHA first
    const fileData = await githubRequest(url);
    const sha = fileData.sha;

    // Delete the file
    const payload = {
      message: `Delete ${filePath}`,
      sha: sha,
      branch: GITHUB_CONFIG.branch
    };

    await githubRequest(url, 'DELETE', payload);
    console.log(`Successfully deleted ${filePath}`);
    return true;

  } catch (error) {
    console.error('Error deleting from GitHub:', error);
    throw error;
  }
}

// List all files in a directory
async function listGitHubDirectory(dirPath) {
  const url = getApiUrl(dirPath);
  
  try {
    const contents = await githubRequest(url);
    return contents.filter(item => item.type === 'file').map(item => item.name);
  } catch (error) {
    if (error.message.includes('404')) {
      console.log(`Directory ${dirPath} does not exist yet`);
      return [];
    }
    console.error('Error listing directory:', error);
    throw error;
  }
}

// User management functions
export async function registerUser(email, password, userData = {}) {
  try {
    const userId = Date.now().toString(); // Simple ID generation
    const userFile = `data/users/${userId}.json`;
    
    const user = {
      id: userId,
      email,
      password, // In production, hash this!
      role: userData.role || 'patient',
      createdAt: new Date().toISOString(),
      ...userData
    };

    await saveToGitHub(userFile, user);
    return { success: true, userId, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function loginUser(email, password) {
  try {
    // Get list of all user files
    const userFiles = await listGitHubDirectory('data/users');
    
    // Check each user file for matching credentials
    for (const fileName of userFiles) {
      const userData = await loadFromGitHub(`data/users/${fileName}`);
      if (userData && userData.email === email && userData.password === password) {
        return { 
          success: true, 
          userId: userData.id, 
          user: userData 
        };
      }
    }
    
    return { success: false, error: 'Invalid credentials' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getCurrentUser(userId) {
  try {
    const userData = await loadFromGitHub(`data/users/${userId}.json`);
    return userData;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Patient data management functions
export async function savePatientData(userId, patientData) {
  try {
    const patientFile = `data/patients/${userId}.json`;
    
    const data = {
      userId,
      ...patientData,
      lastUpdated: new Date().toISOString()
    };

    await saveToGitHub(patientFile, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getPatientData(userId) {
  try {
    const patientData = await loadFromGitHub(`data/patients/${userId}.json`);
    return patientData;
  } catch (error) {
    console.error('Error getting patient data:', error);
    return null;
  }
}

export async function getAllPatientData() {
  try {
    const patientFiles = await listGitHubDirectory('data/patients');
    const allPatients = [];
    
    for (const fileName of patientFiles) {
      const patientData = await loadFromGitHub(`data/patients/${fileName}`);
      if (patientData) {
        allPatients.push(patientData);
      }
    }
    
    return allPatients;
  } catch (error) {
    console.error('Error getting all patient data:', error);
    return [];
  }
}

export async function deletePatientData(userId) {
  try {
    await deleteFromGitHub(`data/patients/${userId}.json`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
